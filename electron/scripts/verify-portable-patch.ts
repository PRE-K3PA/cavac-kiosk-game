import { readFileSync } from "node:fs";
import path from "node:path";

// Portable 템플릿 패치(patches/)가 적용되지 않으면 exe 가 예전처럼 켤 때마다 앱 전체를 풀어서,
// 시작 시간 개선이 아무 오류 없이 사라집니다. electron-builder 를 올리면서 패치가 빠지는 경우를 막습니다 (#205)
const templatePath = path.join(
	import.meta.dirname,
	"../../node_modules/app-builder-lib/templates/nsis/portable.nsi",
);
const PATCH_MARKER = "CACHE_ROOT";

function isPatched(): boolean {
	try {
		return readFileSync(templatePath, "utf8").includes(PATCH_MARKER);
	} catch {
		return false;
	}
}

if (!isPatched()) {
	console.error(
		"Portable 템플릿 패치가 적용되지 않았습니다. bun install 로 패치를 적용하거나, " +
			"electron-builder 를 올렸다면 patches/ 의 패치를 새 버전에 맞게 다시 만드세요.",
	);
	process.exit(1);
}
