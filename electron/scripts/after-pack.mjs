import { rm } from "node:fs/promises";
import path from "node:path";

// WebGPU 셰이더 컴파일러입니다. 이 앱은 WebGPU 를 쓰지 않는데, Portable 은 처음 켤 때 앱 전체를
// 풀기 때문에 안 쓰는 파일은 뺍니다 (#205). 화면이 안 뜨는 PC 가 있으면 이 두 파일부터 되돌려 보세요.
// 없는 파일이면 그냥 넘어갑니다
const UNUSED_WINDOWS_FILES = ["dxcompiler.dll", "dxil.dll"];

export default async function removeUnusedElectronFiles(context) {
	if (context.electronPlatformName !== "win32") return;
	await Promise.all(
		UNUSED_WINDOWS_FILES.map((file) => rm(path.join(context.appOutDir, file), { force: true })),
	);
}
