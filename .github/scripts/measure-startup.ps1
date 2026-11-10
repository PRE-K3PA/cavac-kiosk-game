# 이슈 #205: 빌드 조합마다 Portable exe 를 실행해서, 앱 프로세스가 생길 때까지와 프로그램 창이 뜰 때까지의
# 시간을 잽니다. Portable 은 압축을 다 푼 뒤에야 앱 프로세스가 생기므로, 앱 프로세스까지의 시간이 곧 풀기 시간입니다.
# 1차 측정(Portable·압축 안 한 앱 폴더·설치형, Defender 켬·끔)은 커밋 dbf838e 의 이 파일로 쟀습니다.
param(
	[Parameter(Mandatory)] [string] $BuildsRoot,
	[Parameter(Mandatory)] [string[]] $Builds,
	[Parameter(Mandatory)] [string] $OutDir,
	[int] $Runs = 5,
	[int] $TimeoutSeconds = 60
)

$ErrorActionPreference = "Stop"

$AppProcessName = "CAVAC Kiosk"
$PortableProcessPattern = "$AppProcessName Portable*"
$PollMs = 50
# 창이 뜬 뒤 첫 화면이 설정 파일을 만들 때까지 기다렸다가 끕니다
$SettleMs = 3000
$MaxWindowFailures = 3

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$OutDir = (Resolve-Path $OutDir).Path
$BuildsRoot = (Resolve-Path $BuildsRoot).Path
$TempRoot = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { [IO.Path]::GetTempPath() }
$WorkDir = Join-Path $TempRoot "startup-measure"
New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null

# Electron 은 앱 이름으로 userData 폴더를 만듭니다. 1차 측정에서 cavac-kiosk-game 으로 확인했습니다
$UserDataDir = Join-Path $env:APPDATA "cavac-kiosk-game"

$Results = [Collections.Generic.List[object]]::new()
$Notes = [Collections.Generic.List[string]]::new()
$script:WindowFailures = 0

function Write-Note {
	param([string] $Text)
	Write-Host $Text
	$Notes.Add($Text)
}

function Get-SizeMb {
	param([string] $Path)
	$bytes = (Get-ChildItem -Path $Path -Recurse -File | Measure-Object -Property Length -Sum).Sum
	return [math]::Round($bytes / 1MB, 1)
}

function Wait-ProcessExit {
	param([string] $Name, [int] $Seconds)
	$deadline = (Get-Date).AddSeconds($Seconds)
	while ((Get-Process -Name $Name -ErrorAction SilentlyContinue) -and (Get-Date) -lt $deadline) {
		Start-Sleep -Milliseconds 200
	}
	Get-Process -Name $Name -ErrorAction SilentlyContinue |
		Stop-Process -Force -ErrorAction SilentlyContinue
}

function Stop-App {
	foreach ($process in @(Get-Process -Name $AppProcessName -ErrorAction SilentlyContinue)) {
		if ($process.MainWindowHandle -ne [IntPtr]::Zero) { [void]$process.CloseMainWindow() }
	}
	Wait-ProcessExit $AppProcessName 10
	# Portable 실행기는 앱이 끝나면 풀어 둔 임시 폴더를 지우고 끝납니다
	Wait-ProcessExit $PortableProcessPattern 30
	Start-Sleep -Milliseconds 1000
}

function Clear-AppData {
	param([string[]] $Paths)
	foreach ($path in $Paths) {
		if (Test-Path $path) { Remove-Item -Path $path -Recurse -Force }
	}
}

function Measure-Launch {
	param([string] $ExePath)
	Stop-App
	$processMs = $null
	$windowMs = $null
	$watch = [Diagnostics.Stopwatch]::StartNew()
	Start-Process -FilePath $ExePath -WorkingDirectory (Split-Path $ExePath) | Out-Null
	while ($watch.Elapsed.TotalSeconds -lt $TimeoutSeconds) {
		$processes = @(Get-Process -Name $AppProcessName -ErrorAction SilentlyContinue)
		if ($processes.Count -gt 0 -and $null -eq $processMs) {
			$processMs = $watch.ElapsedMilliseconds
		}
		if ($processes | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero }) {
			$windowMs = $watch.ElapsedMilliseconds
			break
		}
		Start-Sleep -Milliseconds $PollMs
	}
	Start-Sleep -Milliseconds $SettleMs
	Stop-App
	return [pscustomobject]@{ ProcessMs = $processMs; WindowMs = $windowMs }
}

function Add-Result {
	param([string] $Build, [string] $Scenario, [int] $Run, $Measured)
	$Results.Add([pscustomobject]@{
		Order = $Results.Count + 1
		Build = $Build
		Scenario = $Scenario
		Run = $Run
		ProcessMs = $Measured.ProcessMs
		WindowMs = $Measured.WindowMs
	})
	Write-Host ("{0} {1} #{2}: 앱 프로세스 {3}ms, 창 {4}ms" -f $Build, $Scenario, $Run,
		$Measured.ProcessMs, $Measured.WindowMs)
	if ($null -eq $Measured.WindowMs) {
		$script:WindowFailures++
		if ($script:WindowFailures -ge $MaxWindowFailures) {
			throw "프로그램 창을 $MaxWindowFailures 번 연속 찾지 못해 측정을 멈춥니다"
		}
	} else {
		$script:WindowFailures = 0
	}
}

function Get-DefenderRealTime {
	try {
		return [bool](Get-MpComputerStatus).RealTimeProtectionEnabled
	} catch {
		return $false
	}
}

function Enable-Defender {
	try {
		Set-MpPreference -DisableRealtimeMonitoring $false
		$exclusions = @((Get-MpPreference).ExclusionPath | Where-Object { $_ })
		if ($exclusions.Count -gt 0) {
			Remove-MpPreference -ExclusionPath $exclusions
			Write-Note "Defender 제외 경로를 지움: $($exclusions -join ', ')"
		}
		Start-Sleep -Seconds 3
	} catch {
		Write-Note "Defender 실시간 검사를 켜지 못함: $($_.Exception.Message)"
	}
}

function New-Target {
	param([string] $Name)
	$buildDir = Join-Path $BuildsRoot $Name
	$exe = Get-ChildItem -Path $buildDir -Filter "*Portable*.exe" | Select-Object -First 1
	$unpackedDir = Join-Path $buildDir "win-unpacked"
	if (-not $exe -or -not (Test-Path $unpackedDir)) { throw "$Name 빌드 결과물을 찾지 못했습니다" }
	# 이슈의 재현 단계처럼 exe 를 다른 폴더로 옮겨서 실행합니다
	$runDir = Join-Path $WorkDir $Name
	New-Item -ItemType Directory -Force -Path $runDir | Out-Null
	Copy-Item -Path $exe.FullName -Destination $runDir
	return [pscustomobject]@{
		Name = $Name
		Exe = Join-Path $runDir $exe.Name
		DataPaths = @((Join-Path $runDir "cavac-data"), $UserDataDir)
		ExeMb = Get-SizeMb $exe.FullName
		UnpackedMb = Get-SizeMb $unpackedDir
		UnpackedFiles = @(Get-ChildItem -Path $unpackedDir -Recurse -File).Count
	}
}

function Format-Seconds {
	param($Milliseconds)
	if ($null -eq $Milliseconds) { return "-" }
	return "{0:N2}" -f ($Milliseconds / 1000)
}

function Get-Average {
	param($Rows, [string] $Property)
	$values = @($Rows | Where-Object { $null -ne $_.$Property })
	if ($values.Count -eq 0) { return $null }
	return ($values | Measure-Object -Property $Property -Average).Average
}

function Write-Summary {
	param($Targets)
	$os = Get-CimInstance Win32_OperatingSystem
	$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
	$lines = [Collections.Generic.List[string]]::new()
	$lines.Add("## Portable 설정 조합별 시작 시간 (#205)")
	$lines.Add("")
	$lines.Add("- 러너: $($os.Caption) $($os.Version)")
	$lines.Add("- CPU: $($cpu.Name.Trim()), 논리 코어 $($cpu.NumberOfLogicalProcessors)")
	$lines.Add(("- 메모리: {0:N1} GB" -f ($os.TotalVisibleMemorySize / 1MB)))
	$lines.Add("- 조합마다 $Runs 번, 조합을 한 바퀴씩 번갈아 잼. 시간은 초 단위")
	$lines.Add("- 풀기 = 앱 프로세스가 생길 때까지, 켜짐 = 프로그램 창이 뜰 때까지")
	$lines.Add("")
	$lines.Add("| 조합 | exe | 풀린 크기 | 파일 | 첫 실행 켜짐 | 다시 실행 켜짐 | 다시 실행 풀기 | 맨 처음 1회 | 실패 |")
	$lines.Add("| --- | --- | --- | --- | --- | --- | --- | --- | --- |")
	foreach ($target in $Targets) {
		$rows = @($Results | Where-Object { $_.Build -eq $target.Name })
		$first = @($rows | Where-Object { $_.Scenario -eq "first" })
		$repeat = @($rows | Where-Object { $_.Scenario -eq "repeat" })
		$veryFirst = $first | Select-Object -First 1
		$failures = @($rows | Where-Object { $null -eq $_.WindowMs }).Count
		$lines.Add(("| {0} | {1} MB | {2} MB | {3} | {4} | {5} | {6} | {7} | {8} |" -f $target.Name,
			$target.ExeMb, $target.UnpackedMb, $target.UnpackedFiles,
			(Format-Seconds (Get-Average $first "WindowMs")),
			(Format-Seconds (Get-Average $repeat "WindowMs")),
			(Format-Seconds (Get-Average $repeat "ProcessMs")),
			(Format-Seconds $veryFirst.WindowMs), $failures))
	}
	$lines.Add("")
	$lines.Add("### 기록")
	foreach ($note in $Notes) { $lines.Add("- $note") }

	$markdown = $lines -join "`n"
	Write-Host $markdown
	Set-Content -Path (Join-Path $OutDir "summary.md") -Value $markdown -Encoding utf8
	if ($env:GITHUB_STEP_SUMMARY) {
		Add-Content -Path $env:GITHUB_STEP_SUMMARY -Value $markdown -Encoding utf8
	}
	$Results | Export-Csv -Path (Join-Path $OutDir "runs.csv") -NoTypeInformation -Encoding utf8
}

$targets = @($Builds | ForEach-Object { New-Target $_ })
try {
	Write-Note ("Defender 처음 상태: 실시간 검사 {0}" -f (Get-DefenderRealTime))
	# 부스 PC 처럼 실시간 검사를 켠 상태로 잽니다
	Enable-Defender
	Write-Note ("측정 중 Defender: 실시간 검사 {0}" -f (Get-DefenderRealTime))
	# 조합을 한 바퀴씩 번갈아 재서, 순서 때문에 생기는 차이(캐시 등)가 한 조합에 몰리지 않게 합니다
	foreach ($scenario in @("first", "repeat")) {
		for ($run = 1; $run -le $Runs; $run++) {
			foreach ($target in $targets) {
				if ($scenario -eq "first") { Clear-AppData $target.DataPaths }
				Add-Result $target.Name $scenario $run (Measure-Launch $target.Exe)
			}
		}
	}
} finally {
	Stop-App
	Write-Summary $targets
}
