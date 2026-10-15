import { randomUUID } from "node:crypto";
import { copyFile, mkdir, open, readdir, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { collectImagePaths, IMAGE_KINDS_BY_FILE } from "@/data/images";
import { LIMITS } from "@/data/schema";
import {
	DATA_FILES,
	IMAGE_KINDS,
	type ImageKind,
	type ImagePath,
	type ImageResult,
} from "@/types/data";
import type { DataStore } from "./data-store";
import { retryOnFileLock } from "./retry";

type ImageFormat = "png" | "jpg";

// 확장자만 바꾼 파일을 거르기 위해 파일 앞부분의 시그니처를 함께 봅니다
const SIGNATURES: Record<ImageFormat, readonly number[]> = {
	png: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
	jpg: [0xff, 0xd8, 0xff],
};

const FORMAT_BY_EXTENSION: Record<string, ImageFormat> = {
	".png": "png",
	".jpg": "jpg",
	".jpeg": "jpg",
};

export const IMAGE_FILE_EXTENSIONS = ["png", "jpg", "jpeg"];

async function hasSignature(filePath: string, format: ImageFormat): Promise<boolean> {
	const signature = SIGNATURES[format];
	const handle = await open(filePath, "r");
	try {
		const header = Buffer.alloc(signature.length);
		const { bytesRead } = await handle.read(header, 0, signature.length, 0);
		return (
			bytesRead === signature.length && signature.every((byte, index) => header[index] === byte)
		);
	} finally {
		await handle.close();
	}
}

/** 고른 파일을 확인하고 images/<kind>/<uuid>.<ext> 로 복사합니다 */
export async function importImage(
	imagesDir: string,
	kind: ImageKind,
	sourcePath: string,
): Promise<ImageResult> {
	const format = FORMAT_BY_EXTENSION[path.extname(sourcePath).toLowerCase()];
	if (!format) return { status: "error", reason: "format" };

	try {
		if ((await stat(sourcePath)).size > LIMITS.imageMaxBytes) {
			return { status: "error", reason: "size" };
		}
		if (!(await hasSignature(sourcePath, format))) {
			return { status: "error", reason: "format" };
		}

		const fileName = `${randomUUID()}.${format}`;
		await mkdir(path.join(imagesDir, kind), { recursive: true });
		await retryOnFileLock(() => copyFile(sourcePath, path.join(imagesDir, kind, fileName)));
		return { status: "ok", path: `images/${kind}/${fileName}` };
	} catch {
		return { status: "error", reason: "io" };
	}
}

/** kinds 폴더에서 usedPaths 에 없는 파일을 지웁니다. 지우지 못한 파일은 다음 정리 때 다시 시도합니다 */
export async function removeUnusedImages(
	imagesDir: string,
	kinds: readonly ImageKind[],
	usedPaths: readonly ImagePath[],
): Promise<void> {
	const used = new Set(usedPaths);
	for (const kind of kinds) {
		const dir = path.join(imagesDir, kind);
		const fileNames = await readdir(dir).catch(() => []);
		for (const fileName of fileNames) {
			if (used.has(`images/${kind}/${fileName}`)) continue;
			await unlink(path.join(dir, fileName)).catch(() => undefined);
		}
	}
}

/** 원본을 읽지 못해 복구한 설정은 원래 쓰던 이미지를 모르므로, 그 설정의 폴더는 정리하지 않습니다 */
export async function removeUnusedImagesOnStartup(
	imagesDir: string,
	dataStore: DataStore,
): Promise<void> {
	for (const file of DATA_FILES) {
		const { data, isRecovered } = await dataStore.load(file);
		if (isRecovered) continue;
		await removeUnusedImages(imagesDir, IMAGE_KINDS_BY_FILE[file], collectImagePaths(file, data));
	}
}

/** cavac://images/<kind>/<file> 을 imagesDir 안의 파일 경로로 바꿉니다. 다른 모양이면 undefined */
export function resolveImageUrl(imagesDir: string, url: string): string | undefined {
	try {
		const { host, pathname } = new URL(url);
		const segments = pathname.split("/").slice(1).map(decodeURIComponent);
		if (host !== "images" || segments.length !== 2) return undefined;

		// 인코딩된 구분자나 점으로 시작하는 이름으로 images 밖을 가리키지 못하게 파일 이름 하나만 받습니다
		const [kind, fileName] = segments;
		const isFileName = fileName === path.basename(fileName) && !fileName.startsWith(".");
		if (!IMAGE_KINDS.some((imageKind) => imageKind === kind) || !isFileName) return undefined;
		return path.join(imagesDir, kind, fileName);
	} catch {
		return undefined;
	}
}
