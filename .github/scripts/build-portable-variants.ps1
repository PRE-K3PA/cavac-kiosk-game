# 이슈 #205: electron-builder.yml 에 설정을 더한 조합마다 Portable exe 를 따로 빌드합니다.
# 원본 electron-builder.yml 은 고치지 않고, 러너 안에서만 조합별 설정 파일을 만들어 씁니다.
param(
	[Parameter(Mandatory)] [string] $OutRoot
)

$ErrorActionPreference = "Stop"

$LanguagesBlock = "electronLanguages:`n  - ko`n  - en-US`n"
$PortablePattern = "(?m)^portable:\n"

function Add-Languages {
	param([string] $Config)
	if ($Config -match "(?m)^electronLanguages:") { throw "electronLanguages 가 이미 있습니다" }
	return $Config + $LanguagesBlock
}

function Add-UseZip {
	param([string] $Config)
	if ($Config -notmatch $PortablePattern) { throw "portable 설정을 찾지 못했습니다" }
	return $Config -replace $PortablePattern, "portable:`n  useZip: true`n"
}

$base = (Get-Content -Path "electron-builder.yml" -Raw) -replace "`r`n", "`n"
$variants = [ordered]@{
	"current" = $base
	"languages" = Add-Languages $base
	"zip" = Add-UseZip $base
	"languages-zip" = Add-Languages (Add-UseZip $base)
}

foreach ($name in $variants.Keys) {
	$configPath = "electron-builder.$name.yml"
	Set-Content -Path $configPath -Value $variants[$name] -NoNewline -Encoding utf8
	Write-Host "===== $name ====="
	Get-Content -Path $configPath | ForEach-Object { Write-Host $_ }
	bun run dist --win portable --publish never --config $configPath "-c.directories.output=$OutRoot/$name"
	if ($LASTEXITCODE -ne 0) { throw "$name 빌드에 실패했습니다" }
}
