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

export function ensureStorageDirs(): void {
	for (const dir of [getDataDir(), ...IMAGE_KINDS.map(getImageDir)]) {
		mkdirSync(dir, { recursive: true });
	}
}
