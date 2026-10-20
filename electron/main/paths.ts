import { mkdirSync } from "node:fs";
import path from "node:path";
import { app } from "electron";
import { IMAGE_KINDS, type ImageKind } from "@/types/data";
import { resolveStorageRoot } from "./storage-root";

// Chromium 캐시는 userData 에 그대로 두고, 옮겨야 하는 설정과 사진만 이 폴더에 둡니다
function getStorageRoot(): string {
	return resolveStorageRoot(process.env.PORTABLE_EXECUTABLE_DIR, app.getPath("userData"));
}

export function getDataDir(): string {
	return path.join(getStorageRoot(), "data");
}

export function getImagesDir(): string {
	return path.join(getStorageRoot(), "images");
}

export function getImageDir(kind: ImageKind): string {
	return path.join(getImagesDir(), kind);
}

export function ensureStorageDirs(): void {
	for (const dir of [getDataDir(), ...IMAGE_KINDS.map(getImageDir)]) {
		mkdirSync(dir, { recursive: true });
	}
}
