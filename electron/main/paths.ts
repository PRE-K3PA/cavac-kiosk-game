import { mkdirSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import { IMAGE_KINDS, type ImageKind } from "@/types/data";

export function getDataDir(): string {
	return path.join(app.getPath("userData"), "data");
}

export function getImagesDir(): string {
	return path.join(app.getPath("userData"), "images");
}

export function getImageDir(kind: ImageKind): string {
	return path.join(getImagesDir(), kind);
}

// 배포본에서는 electron-builder 의 extraResources 로 앱 밖 resources 폴더에 복사됩니다
export function getDefaultSpeciesDir(): string {
	return app.isPackaged
		? path.join(process.resourcesPath, "default-species")
		: path.join(app.getAppPath(), "resources", "default-species");
}

export function ensureStorageDirs(): void {
	for (const dir of [getDataDir(), ...IMAGE_KINDS.map(getImageDir)]) {
		mkdirSync(dir, { recursive: true });
	}
}
