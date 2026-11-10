# 이슈 #205: exe 를 실행한 뒤 앱 프로세스가 생길 때까지, 프로그램 창이 뜰 때까지의 시간을 잽니다.
# Portable 은 압축을 다 푼 뒤에야 앱 프로세스가 생기므로, 앱 프로세스까지의 시간이 곧 풀기 시간입니다.
param(
	[Parameter(Mandatory)] [string] $ReleaseDir,
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

$MethodLabels = @{ portable = "Portable"; unpacked = "압축 안 한 앱 폴더"; installed = "설치형" }
$ScenarioLabels = @{ first = "첫 실행 (데이터 없음)"; repeat = "다시 실행 (데이터 있음)" }

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$OutDir = (Resolve-Path $OutDir).Path
$ReleaseDir = (Resolve-Path $ReleaseDir).Path
$TempRoot = if ($env:RUNNER_TEMP) { $env:RUNNER_TEMP } else { [IO.Path]::GetTempPath() }
$WorkDir = Join-Path $TempRoot "startup-measure"
New-Item -ItemType Directory -Force -Path $WorkDir | Out-Null

$PortableExe = Get-ChildItem -Path $ReleaseDir -Filter "*Portable*.exe" | Select-Object -First 1
$SetupExe = Get-ChildItem -Path $ReleaseDir -Filter "*Setup*.exe" | Select-Object -First 1
$UnpackedDir = Join-Path $ReleaseDir "win-unpacked"
if (-not $PortableExe -or -not $SetupExe -or -not (Test-Path $UnpackedDir)) {
	throw "빌드 결과물을 찾지 못했습니다: $ReleaseDir"
}

# Electron 은 앱 이름으로 userData 폴더를 만듭니다. 이름이 productName 인지 name 인지에 따라 달라서 둘 다 지웁니다
$UserDataCandidates = @(
	(Join-Path $env:APPDATA "cavac-kiosk-game"),
	(Join-Path $env:APPDATA $AppProcessName)
)

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
	param([string] $Pass, [string] $Method, [string] $Scenario, [int] $Run, $Measured)
	$Results.Add([pscustomobject]@{
		Order = $Results.Count + 1
		Pass = $Pass
		Method = $Method
		Scenario = $Scenario
		Run = $Run
		ProcessMs = $Measured.ProcessMs
		WindowMs = $Measured.WindowMs
	})
	Write-Host ("[{0}] {1} {2} #{3}: 앱 프로세스 {4}ms, 창 {5}ms" -f $Pass, $Method, $Scenario, $Run,
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

function Invoke-Scenario {
	param([string] $Pass, [string] $Method, [string] $ExePath, [string[]] $DataPaths)
	for ($run = 1; $run -le $Runs; $run++) {
		Clear-AppData $DataPaths
		Add-Result $Pass $Method "first" $run (Measure-Launch $ExePath)
	}
	$found = @($DataPaths | Where-Object { Test-Path $_ })
	Write-Note ("{0} {1}: 첫 실행 뒤 생긴 저장 폴더 = {2}" -f $Pass, $Method, ($found -join ", "))
	for ($run = 1; $run -le $Runs; $run++) {
		Add-Result $Pass $Method "repeat" $run (Measure-Launch $ExePath)
	}
}

function Install-App {
	$installDir = Join-Path $WorkDir "installed"
	$watch = [Diagnostics.Stopwatch]::StartNew()
	$arguments = @("/S", "/D=$installDir")
	Start-Process -FilePath $SetupExe.FullName -ArgumentList $arguments -Wait | Out-Null
	Write-Note ("설치형 조용히 설치: {0:N1}초" -f $watch.Elapsed.TotalSeconds)
	Stop-App
	$exe = @($installDir, (Join-Path $env:LOCALAPPDATA "Programs")) |
		Where-Object { Test-Path $_ } |
		ForEach-Object {
			Get-ChildItem -Path $_ -Filter "$AppProcessName.exe" -Recurse -ErrorAction SilentlyContinue
		} |
		Select-Object -First 1
	if (-not $exe) { throw "설치된 exe 를 찾지 못했습니다" }
	Write-Note "설치 위치: $($exe.DirectoryName)"
	return $exe.FullName
}

function Get-DefenderRealTime {
	try {
		return [bool](Get-MpComputerStatus).RealTimeProtectionEnabled
	} catch {
		return $false
	}
}

function Set-DefenderRealTime {
	param([bool] $Enabled)
	try {
		Set-MpPreference -DisableRealtimeMonitoring (-not $Enabled)
		if ($Enabled) {
			$exclusions = @((Get-MpPreference).ExclusionPath | Where-Object { $_ })
			if ($exclusions.Count -gt 0) {
				Remove-MpPreference -ExclusionPath $exclusions
				Write-Note "Defender 제외 경로를 지움: $($exclusions -join ', ')"
			}
		}
		Start-Sleep -Seconds 3
	} catch {
		Write-Note "Defender 실시간 검사를 바꾸지 못함 ($Enabled): $($_.Exception.Message)"
	}
}

function Invoke-Pass {
	param([string] $Pass, [string] $InstalledExe)
	$passDir = Join-Path $WorkDir $Pass
	$portableDir = Join-Path $passDir "portable"
	$unpackedCopy = Join-Path $passDir "unpacked"
	New-Item -ItemType Directory -Force -Path $portableDir | Out-Null
	# 이슈의 재현 단계처럼 exe 를 다른 폴더로 옮겨서 실행합니다
	Copy-Item -Path $PortableExe.FullName -Destination $portableDir
	Copy-Item -Path $UnpackedDir -Destination $unpackedCopy -Recurse
	$portableCopy = Join-Path $portableDir $PortableExe.Name
	$portableData = @((Join-Path $portableDir "cavac-data")) + $UserDataCandidates
	Invoke-Scenario $Pass "portable" $portableCopy $portableData
	$unpackedExe = Join-Path $unpackedCopy "$AppProcessName.exe"
	Invoke-Scenario $Pass "unpacked" $unpackedExe $UserDataCandidates
	Invoke-Scenario $Pass "installed" $InstalledExe $UserDataCandidates
}

function Format-Seconds {
	param($Milliseconds)
	if ($null -eq $Milliseconds) { return "-" }
	return "{0:N2}" -f ($Milliseconds / 1000)
}

function Write-Summary {
	$os = Get-CimInstance Win32_OperatingSystem
	$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
	$lines = [Collections.Generic.List[string]]::new()
	$lines.Add("## exe 시작 시간 측정 (#205)")
	$lines.Add("")
	$lines.Add("- 러너: $($os.Caption) $($os.Version)")
	$lines.Add("- CPU: $($cpu.Name.Trim()), 논리 코어 $($cpu.NumberOfLogicalProcessors)")
	$lines.Add(("- 메모리: {0:N1} GB" -f ($os.TotalVisibleMemorySize / 1MB)))
	$lines.Add("- Portable exe: $(Get-SizeMb $PortableExe.FullName) MB")
	$lines.Add("- 설치형 exe: $(Get-SizeMb $SetupExe.FullName) MB")
	$fileCount = @(Get-ChildItem -Path $UnpackedDir -Recurse -File).Count
	$lines.Add("- 압축 안 한 앱 폴더: $(Get-SizeMb $UnpackedDir) MB, 파일 $fileCount 개")
	$lines.Add("- 회차마다 $Runs 번, 시간은 초 단위, 실패는 제한 시간($TimeoutSeconds 초) 안에 창을 못 찾은 횟수")
	$lines.Add("")
	$lines.Add("| 묶음 | 방식 | 상황 | 창 평균 | 창 최소 | 창 최대 | 앱 프로세스 평균 | 실패 |")
	$lines.Add("| --- | --- | --- | --- | --- | --- | --- | --- |")
	foreach ($group in ($Results | Group-Object -Property Pass, Method, Scenario)) {
		$first = $group.Group[0]
		$windows = @($group.Group | Where-Object { $null -ne $_.WindowMs })
		$processes = @($group.Group | Where-Object { $null -ne $_.ProcessMs })
		$window = if ($windows.Count) { $windows | Measure-Object WindowMs -Average -Minimum -Maximum }
		$process = if ($processes.Count) { $processes | Measure-Object ProcessMs -Average }
		$lines.Add(("| {0} | {1} | {2} | {3} | {4} | {5} | {6} | {7} |" -f $first.Pass,
			$MethodLabels[$first.Method], $ScenarioLabels[$first.Scenario],
			(Format-Seconds $window.Average), (Format-Seconds $window.Minimum),
			(Format-Seconds $window.Maximum), (Format-Seconds $process.Average),
			($group.Count - $windows.Count)))
	}
	if ($Results.Count -gt 0) {
		$veryFirst = $Results[0]
		$lines.Add("")
		$lines.Add(("- 맨 처음 1회 ({0} {1}): 앱 프로세스 {2}초, 창 {3}초" -f $veryFirst.Pass,
			$MethodLabels[$veryFirst.Method], (Format-Seconds $veryFirst.ProcessMs),
			(Format-Seconds $veryFirst.WindowMs)))
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

try {
	Write-Note ("Defender 처음 상태: 실시간 검사 {0}" -f (Get-DefenderRealTime))
	$installedExe = Install-App
	$measuredPasses = @{}
	# 부스 PC 처럼 실시간 검사가 켜진 상태를 먼저 재고, 꺼진 상태와 비교합니다
	foreach ($enabled in @($true, $false)) {
		Set-DefenderRealTime $enabled
		$pass = if (Get-DefenderRealTime) { "defender-on" } else { "defender-off" }
		if ($measuredPasses.ContainsKey($pass)) {
			Write-Note "Defender 상태를 바꾸지 못해 $pass 는 한 번만 잽니다"
			continue
		}
		$measuredPasses[$pass] = $true
		Invoke-Pass $pass $installedExe
	}
} finally {
	Stop-App
	Write-Summary
}
