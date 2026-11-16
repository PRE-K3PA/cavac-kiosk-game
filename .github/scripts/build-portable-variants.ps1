# 이슈 #205: 같은 코드를 세 가지 설정으로 배포와 같게 빌드해서 Portable exe 를 비교합니다.
#   before: 바꾸기 전(develop)의 electron-builder.yml·package.json, 패치 안 한 Portable 템플릿
#   diet:   이 브랜치의 설정(풀 양 줄이기), 패치 안 한 Portable 템플릿
#   reuse:  diet + 풀어 둔 앱을 재사용하도록 고친 Portable 템플릿(patches/ 의 패치)
# 풀 양 줄이기의 효과는 package.json(런타임 의존성을 devDependencies 로 옮김)에서도 나오므로
# before 는 package.json 도 develop 것으로 빌드합니다.
# 1·2차 측정에서 설정 조합(언어 파일·zip)을 만든 방법은 커밋 3fc83c1 의 이 파일에 있습니다.
param(
	[Parameter(Mandatory)] [string] $OutRoot,
	[string] $BaseRef = "develop"
)

$ErrorActionPreference = "Stop"

git fetch --depth 1 origin $BaseRef
if ($LASTEXITCODE -ne 0) { throw "$BaseRef 를 가져오지 못했습니다" }
$beforeConfig = git show "FETCH_HEAD:electron-builder.yml"
if ($LASTEXITCODE -ne 0) { throw "$BaseRef 의 electron-builder.yml 을 읽지 못했습니다" }
$beforePackage = git show "FETCH_HEAD:package.json"
if ($LASTEXITCODE -ne 0) { throw "$BaseRef 의 package.json 을 읽지 못했습니다" }

$afterConfig = (Get-Content -Path "electron-builder.yml" -Raw) -replace "`r`n", "`n"
$afterPackage = Get-Content -Path "package.json" -Raw
$beforeConfig = ($beforeConfig -join "`n") + "`n"
$beforePackage = ($beforePackage -join "`n") + "`n"

$variants = @(
	@{ Name = "before"; Config = $beforeConfig; Package = $beforePackage; Patched = $false },
	@{ Name = "diet"; Config = $afterConfig; Package = $afterPackage; Patched = $false },
	@{ Name = "reuse"; Config = $afterConfig; Package = $afterPackage; Patched = $true }
)

# bun install 은 패치를 적용해 두므로, 패치 안 한 템플릿이 필요한 조합은 같은 버전의 원본 템플릿으로 바꿔 끼웁니다
$libDir = "node_modules/app-builder-lib"
$templatePath = "$libDir/templates/nsis/portable.nsi"
$templateDir = Join-Path ([IO.Path]::GetTempPath()) "portable-templates"
New-Item -ItemType Directory -Force -Path $templateDir | Out-Null
$patchedTemplate = Join-Path $templateDir "portable.patched.nsi"
$originalTemplate = Join-Path $templateDir "portable.original.nsi"

Copy-Item -Path $templatePath -Destination $patchedTemplate -Force
if (-not (Select-String -Path $patchedTemplate -Pattern "CACHE_ROOT" -Quiet)) {
	throw "bun install 이 Portable 템플릿 패치를 적용하지 않았습니다"
}

$libVersion = (Get-Content -Path "$libDir/package.json" -Raw | ConvertFrom-Json).version
$tarball = Join-Path $templateDir "app-builder-lib.tgz"
Invoke-WebRequest -Uri "https://registry.npmjs.org/app-builder-lib/-/app-builder-lib-$libVersion.tgz" -OutFile $tarball
tar -xzf $tarball -C $templateDir package/templates/nsis/portable.nsi
if ($LASTEXITCODE -ne 0) { throw "원본 Portable 템플릿을 풀지 못했습니다" }
Move-Item -Path (Join-Path $templateDir "package/templates/nsis/portable.nsi") -Destination $originalTemplate -Force
if (Select-String -Path $originalTemplate -Pattern "CACHE_ROOT" -Quiet) {
	throw "원본 템플릿에 패치 내용이 들어 있습니다"
}

function Set-TemplatePatched {
	param([bool] $Patched)
	$source = if ($Patched) { $patchedTemplate } else { $originalTemplate }
	Copy-Item -Path $source -Destination $templatePath -Force
}

# 설치형과 Portable 을 함께 빌드하면 Portable 은 설치형의 압축 파일(작은 단위로 나눠 압축)을 같이 써서,
# Portable 만 빌드할 때와 크기도 푸는 속도도 다릅니다. 실제 배포(bun run dist)와 같게 둘 다 빌드합니다
# 빌드 중에는 package.json 과 Portable 템플릿을 조합에 맞게 바꾸므로, 실패해도 이 브랜치 상태로 되돌립니다
try {
	foreach ($variant in $variants) {
		$name = $variant.Name
		$configPath = "electron-builder.$name.yml"
		Set-Content -Path $configPath -Value $variant.Config -NoNewline -Encoding utf8
		Write-Host "===== $name ====="
		Get-Content -Path $configPath | ForEach-Object { Write-Host $_ }
		Set-Content -Path "package.json" -Value $variant.Package -NoNewline -Encoding utf8
		Set-TemplatePatched $variant.Patched
		bun run dist --publish never --config $configPath "-c.directories.output=$OutRoot/$name"
		if ($LASTEXITCODE -ne 0) { throw "$name 빌드에 실패했습니다" }
	}
} finally {
	Set-Content -Path "package.json" -Value $afterPackage -NoNewline -Encoding utf8
	Set-TemplatePatched $true
}
