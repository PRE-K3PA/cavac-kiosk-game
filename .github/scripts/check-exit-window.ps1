# 이슈 #209: Portable exe 를 끌 때 창이 잠깐 뜨는지 러너에서 확인합니다 (임시, PR 전에 지움).
# 빌드마다 두 가지로 실행합니다
#   cold: 풀어 둔 앱과 설정을 지우고 실행 (시작 그림이 뜨는 처음 실행)
#   warm: 바로 다시 실행 (한 번 푼 앱을 재사용)
# 앱 창이 뜬 뒤 정상 종료(CloseMainWindow)하고, Portable 실행기 프로세스가 보이는 창을 만드는지 기록합니다.
# 시작 때 시작 그림 창이 잡히는지도 같이 적어서, 창 감지가 되고 있다는 기준으로 씁니다.
param(
	[Parameter(Mandatory)] [string] $BuildsRoot,
	[Parameter(Mandatory)] [string[]] $Builds,
	[Parameter(Mandatory)] [string] $OutDir,
	[int] $Runs = 2,
	[int] $StartTimeoutSeconds = 90
)

$ErrorActionPreference = "Stop"

$AppProcessName = "CAVAC Kiosk"
$PortablePattern = "$AppProcessName Portable*"
$PollMs = 20
$SettleMs = 3000
$ExitTimeoutSeconds = 30
$AfterGoneMs = 500

Add-Type -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;

public static class WindowProbe
{
	delegate bool EnumProc(IntPtr hWnd, IntPtr lParam);

	[StructLayout(LayoutKind.Sequential)]
	struct Rect { public int Left, Top, Right, Bottom; }

	[DllImport("user32.dll")] static extern bool EnumWindows(EnumProc proc, IntPtr lParam);
	[DllImport("user32.dll")] static extern bool IsWindowVisible(IntPtr hWnd);
	[DllImport("user32.dll")] static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
	[DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetClassName(IntPtr hWnd, StringBuilder text, int max);
	[DllImport("user32.dll", CharSet = CharSet.Unicode)] static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int max);
	[DllImport("user32.dll")] static extern bool GetWindowRect(IntPtr hWnd, out Rect rect);

	public static string[] Visible(int[] pids)
	{
		var found = new List<string>();
		var wanted = new HashSet<int>(pids);
		EnumWindows((hWnd, lParam) =>
		{
			if (!IsWindowVisible(hWnd)) return true;
			uint pid;
			GetWindowThreadProcessId(hWnd, out pid);
			if (!wanted.Contains((int)pid)) return true;
			var cls = new StringBuilder(256);
			GetClassName(hWnd, cls, 256);
			var title = new StringBuilder(256);
			GetWindowText(hWnd, title, 256);
			Rect r;
			GetWindowRect(hWnd, out r);
			found.Add(string.Format("{0} | '{1}' | {2}x{3} @ {4},{5}", cls, title, r.Right - r.Left, r.Bottom - r.Top, r.Left, r.Top));
			return true;
		}, IntPtr.Zero);
		return found.ToArray();
	}
}
"@

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$OutDir = (Resolve-Path $OutDir).Path
$BuildsRoot = (Resolve-Path $BuildsRoot).Path
$TempRoot = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { [IO.Path]::GetTempPath() }
$WorkDir = Join-Path $TempRoot "exit-window-check"
New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null

$UserDataDir = Join-Path $env:APPDATA "cavac-kiosk-game"
$ReuseCacheDir = Join-Path $env:LOCALAPPDATA "cavac-kiosk-game Portable"

$Results = [Collections.Generic.List[object]]::new()

function Get-WrapperPids {
	return [int[]]@(Get-Process -Name $PortablePattern -ErrorAction SilentlyContinue | ForEach-Object { $_.Id })
}

function Get-AppWindowReady {
	$processes = @(Get-Process -Name $AppProcessName -ErrorAction SilentlyContinue)
	return [bool]($processes | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero })
}

function Get-WrapperWindows {
	$pids = @(Get-WrapperPids)
	if ($pids.Count -eq 0) { return @() }
	return @([WindowProbe]::Visible([int[]]$pids))
}

function Save-Screenshot {
	param([string] $Path)
	try {
		Add-Type -AssemblyName System.Windows.Forms, System.Drawing
		$bounds = [System.Windows.Forms.SystemInformation]::VirtualScreen
		$bitmap = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
		$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
		$graphics.CopyFromScreen($bounds.Left, $bounds.Top, 0, 0, $bitmap.Size)
		$bitmap.Save($Path, [System.Drawing.Imaging.ImageFormat]::Png)
		$graphics.Dispose()
		$bitmap.Dispose()
	} catch {
		Write-Host "스크린샷을 저장하지 못함: $($_.Exception.Message)"
	}
}

function Stop-All {
	foreach ($name in @($AppProcessName, $PortablePattern)) {
		Get-Process -Name $name -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
	}
	Start-Sleep -Milliseconds 1000
}

function Add-Seen {
	param($Seen, [string[]] $Descriptors, [long] $AtMs)
	foreach ($descriptor in $Descriptors) {
		if (-not $Seen.Contains($descriptor)) {
			$Seen[$descriptor] = [pscustomobject]@{ FirstMs = $AtMs; LastMs = $AtMs; Samples = 0 }
		}
		$entry = $Seen[$descriptor]
		$entry.LastMs = $AtMs
		$entry.Samples++
	}
}

function Format-Seen {
	param($Seen)
	return @($Seen.Keys | ForEach-Object {
		$e = $Seen[$_]
		[pscustomobject]@{
			Window = $_
			FirstMs = $e.FirstMs
			LastMs = $e.LastMs
			VisibleMs = $e.LastMs - $e.FirstMs
			Samples = $e.Samples
		}
	})
}

function Invoke-Launch {
	param([string] $Build, [string] $Scenario, [int] $Run, [string] $ExePath)

	$tag = "$Build-$Scenario-$Run"
	$startSeen = [ordered]@{}
	$exitSeen = [ordered]@{}

	$watch = [Diagnostics.Stopwatch]::StartNew()
	Start-Process -FilePath $ExePath -WorkingDirectory (Split-Path $ExePath) | Out-Null
	$startShot = $false
	$appWindowMs = $null
	while ($watch.Elapsed.TotalSeconds -lt $StartTimeoutSeconds) {
		$windows = Get-WrapperWindows
		if ($windows.Count -gt 0) {
			Add-Seen $startSeen $windows $watch.ElapsedMilliseconds
			if (-not $startShot) {
				$startShot = $true
				Save-Screenshot (Join-Path $OutDir "$tag-start.png")
			}
		}
		if (Get-AppWindowReady) {
			$appWindowMs = $watch.ElapsedMilliseconds
			break
		}
		Start-Sleep -Milliseconds $PollMs
	}
	if ($null -eq $appWindowMs) {
		Stop-All
		throw "${tag}: 앱 창을 $StartTimeoutSeconds 초 안에 찾지 못했습니다"
	}
	Start-Sleep -Milliseconds $SettleMs

	# 종료: 앱 창을 닫고, 앱과 Portable 실행기가 끝날 때까지 실행기가 만드는 창을 기록합니다
	foreach ($process in @(Get-Process -Name $AppProcessName -ErrorAction SilentlyContinue)) {
		if ($process.MainWindowHandle -ne [IntPtr]::Zero) { [void]$process.CloseMainWindow() }
	}
	$exitWatch = [Diagnostics.Stopwatch]::StartNew()
	$appGoneMs = $null
	$wrapperGoneMs = $null
	$exitShot = $false
	while ($exitWatch.Elapsed.TotalSeconds -lt $ExitTimeoutSeconds) {
		$now = $exitWatch.ElapsedMilliseconds
		$windows = Get-WrapperWindows
		if ($windows.Count -gt 0) {
			Add-Seen $exitSeen $windows $now
			if (-not $exitShot) {
				$exitShot = $true
				Save-Screenshot (Join-Path $OutDir "$tag-exit.png")
			}
		}
		$appAlive = [bool](Get-Process -Name $AppProcessName -ErrorAction SilentlyContinue)
		$wrapperAlive = (Get-WrapperPids).Count -gt 0
		if (-not $appAlive -and $null -eq $appGoneMs) { $appGoneMs = $now }
		if (-not $wrapperAlive -and $null -eq $wrapperGoneMs) { $wrapperGoneMs = $now }
		if ($null -ne $wrapperGoneMs -and ($now - $wrapperGoneMs) -gt $AfterGoneMs) { break }
		Start-Sleep -Milliseconds $PollMs
	}
	Stop-All

	$startList = Format-Seen $startSeen
	$exitList = Format-Seen $exitSeen
	$Results.Add([pscustomobject]@{
		Build = $Build
		Scenario = $Scenario
		Run = $Run
		AppWindowMs = $appWindowMs
		AppGoneAfterCloseMs = $appGoneMs
		WrapperGoneAfterCloseMs = $wrapperGoneMs
		StartWindows = $startList
		ExitWindows = $exitList
	})
	Write-Host ("{0}: 앱 창 {1}ms, 종료 뒤 앱 {2}ms·실행기 {3}ms 에 사라짐, 시작 때 창 {4}개, 종료 때 창 {5}개" -f
		$tag, $appWindowMs, $appGoneMs, $wrapperGoneMs, $startList.Count, $exitList.Count)
	foreach ($item in $exitList) {
		Write-Host ("  종료 때 보인 창: {0} ({1}ms 동안, {2}~{3}ms)" -f $item.Window, $item.VisibleMs, $item.FirstMs, $item.LastMs)
	}
}

$ExePaths = @{}
foreach ($build in $Builds) {
	$buildDir = Join-Path $BuildsRoot $build
	$exe = Get-ChildItem -Path $buildDir -Filter "*Portable*.exe" | Select-Object -First 1
	if (-not $exe) { throw "$build 빌드 결과물을 찾지 못했습니다" }
	# 이슈의 재현 단계처럼 exe 를 다른 폴더로 옮겨서 실행합니다
	$runDir = Join-Path $WorkDir $build
	New-Item -ItemType Directory -Force -Path $runDir | Out-Null
	Copy-Item -Path $exe.FullName -Destination $runDir -Force
	$ExePaths[$build] = Join-Path $runDir $exe.Name
}

# 빌드가 번갈아 실행되게 같은 순서를 반복합니다
for ($run = 1; $run -le $Runs; $run++) {
	foreach ($build in $Builds) {
		foreach ($path in @($UserDataDir, $ReuseCacheDir)) {
			if (Test-Path $path) { Remove-Item -Path $path -Recurse -Force }
		}
		Stop-All
		Invoke-Launch -Build $build -Scenario "cold" -Run $run -ExePath $ExePaths[$build]
		Invoke-Launch -Build $build -Scenario "warm" -Run $run -ExePath $ExePaths[$build]
	}
}

$Results | ConvertTo-Json -Depth 6 | Set-Content -Path (Join-Path $OutDir "results.json") -Encoding utf8

$lines = [Collections.Generic.List[string]]::new()
$lines.Add("## Portable 종료 때 창 확인 (#209)")
$lines.Add("")
$lines.Add("| 빌드 | 방식 | 회차 | 시작 때 창 | 종료 때 창 | 종료 때 보인 시간(ms) |")
$lines.Add("| --- | --- | --- | --- | --- | --- |")
foreach ($r in $Results) {
	$exitText = if ($r.ExitWindows.Count -eq 0) { "없음" } else { ($r.ExitWindows | ForEach-Object { $_.Window }) -join "<br>" }
	$exitMs = if ($r.ExitWindows.Count -eq 0) { "-" } else { ($r.ExitWindows | ForEach-Object { $_.VisibleMs }) -join ", " }
	$lines.Add("| $($r.Build) | $($r.Scenario) | $($r.Run) | $($r.StartWindows.Count)개 | $exitText | $exitMs |")
}
$summary = $lines -join "`n"
Set-Content -Path (Join-Path $OutDir "summary.md") -Value $summary -Encoding utf8
if ($env:GITHUB_STEP_SUMMARY) { Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value $summary }
