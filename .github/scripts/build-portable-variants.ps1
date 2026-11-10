# 이슈 #205: 바꾸기 전(develop) 설정과 이 브랜치 설정으로 Portable exe 를 하나씩 빌드해서 비교합니다.
# 1·2차 측정에서 설정 조합(언어 파일·zip)을 만든 방법은 커밋 3fc83c1 의 이 파일에 있습니다.
param(
	[Parameter(Mandatory)] [string] $OutRoot,
	[string] $BaseRef = "develop"
)

$ErrorActionPreference = "Stop"

git fetch --depth 1 origin $BaseRef
if ($LASTEXITCODE -ne 0) { throw "$BaseRef 를 가져오지 못했습니다" }
$before = git show "FETCH_HEAD:electron-builder.yml"
if ($LASTEXITCODE -ne 0) { throw "$BaseRef 의 electron-builder.yml 을 읽지 못했습니다" }

$configs = [ordered]@{
	"before" = ($before -join "`n") + "`n"
	"after" = (Get-Content -Path "electron-builder.yml" -Raw) -replace "`r`n", "`n"
}

foreach ($name in $configs.Keys) {
	$configPath = "electron-builder.$name.yml"
	Set-Content -Path $configPath -Value $configs[$name] -NoNewline -Encoding utf8
	Write-Host "===== $name ====="
	Get-Content -Path $configPath | ForEach-Object { Write-Host $_ }
	bun run dist --win portable --publish never --config $configPath "-c.directories.output=$OutRoot/$name"
	if ($LASTEXITCODE -ne 0) { throw "$name 빌드에 실패했습니다" }
}
