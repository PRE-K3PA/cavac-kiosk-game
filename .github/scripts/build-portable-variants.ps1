# 이슈 #205: 바꾸기 전(develop) 설정과 이 브랜치 설정으로 각각 배포와 같게 빌드해서 Portable exe 를 비교합니다.
# 바꾸기 전은 electron-builder.yml 뿐 아니라 package.json 도 develop 것으로 빌드합니다. 런타임 의존성을
# devDependencies 로 옮긴 효과(asar 에서 node_modules 빠짐)가 package.json 에서 나오기 때문입니다.
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

$beforePackage = git show "FETCH_HEAD:package.json"
if ($LASTEXITCODE -ne 0) { throw "$BaseRef 의 package.json 을 읽지 못했습니다" }
$afterPackage = Get-Content -Path "package.json" -Raw

$configs = [ordered]@{
	"before" = ($before -join "`n") + "`n"
	"after" = (Get-Content -Path "electron-builder.yml" -Raw) -replace "`r`n", "`n"
}

$packages = @{
	"before" = ($beforePackage -join "`n") + "`n"
	"after" = $afterPackage -replace "`r`n", "`n"
}

# 설치형과 Portable 을 함께 빌드하면 Portable 은 설치형의 압축 파일(작은 단위로 나눠 압축)을 같이 써서,
# Portable 만 빌드할 때와 크기도 푸는 속도도 다릅니다. 실제 배포(bun run dist)와 같게 둘 다 빌드합니다
# 빌드 중에는 package.json 을 조합에 맞게 바꾸므로, 실패해도 이 브랜치 것으로 되돌립니다
try {
	foreach ($name in $configs.Keys) {
		$configPath = "electron-builder.$name.yml"
		Set-Content -Path $configPath -Value $configs[$name] -NoNewline -Encoding utf8
		Write-Host "===== $name ====="
		Get-Content -Path $configPath | ForEach-Object { Write-Host $_ }
		Set-Content -Path "package.json" -Value $packages[$name] -NoNewline -Encoding utf8
		bun run dist --publish never --config $configPath "-c.directories.output=$OutRoot/$name"
		if ($LASTEXITCODE -ne 0) { throw "$name 빌드에 실패했습니다" }
	}
} finally {
	Set-Content -Path "package.json" -Value $afterPackage -NoNewline -Encoding utf8
}
