import { randomUUID } from "node:crypto";
import { copyFile, mkdir, open, readdir, readFile, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { findImagePaths, isImagePath, LIMITS } from "@/data/schema";
import { DATA_FILES, type DataFile, type ImageKind, type ImageResult } from "@/types/data";
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

// 저장할 때 그 설정 파일의 이미지 폴더만 정리해야, 다른 탭에서 등록하고 아직 저장하지 않은 이미지를 지우지 않습니다
const IMAGE_KINDS_BY_FILE: Record<DataFile, readonly ImageKind[]> = {
	common: ["species"],
	"vaccine-game": ["vaccine-bottle", "vaccine-logo"],
	"card-game": ["product"],
};

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

	const fileName = `${randomUUID()}.${format}`;
	const targetPath = path.join(imagesDir, kind, fileName);
	try {
		if ((await stat(sourcePath)).size > LIMITS.imageMaxBytes) {
			return { status: "error", reason: "size" };
		}
		if (!(await hasSignature(sourcePath, format))) {
			return { status: "error", reason: "format" };
		}

		await mkdir(path.join(imagesDir, kind), { recursive: true });
		await retryOnFileLock(() => copyFile(sourcePath, targetPath));
		return { status: "ok", path: `images/${kind}/${fileName}` };
	} catch {
		await unlink(targetPath).catch(() => undefined);
		return { status: "error", reason: "io" };
	}
}

// 원본뿐 아니라 .bak, .corrupt-* 가 가리키는 이미지도 남겨야 그 파일로 복구했을 때 이미지가 비지 않습니다
async function collectReferencedImages(
	dataDir: string,
	file: DataFile,
): Promise<Set<string> | undefined> {
	const fileNames = await readdir(dataDir).catch(() => []);
	const referenced = new Set<string>();
	for (const fileName of fileNames.filter((name) => name.startsWith(`${file}.json`))) {
		try {
			const text = await readFile(path.join(dataDir, fileName), "utf8");
			for (const imagePath of findImagePaths(text)) referenced.add(imagePath);
		} catch {
			return undefined;
		}
	}
	return referenced;
}

/** 설정 파일들이 가리키지 않는 이미지를 지웁니다. 설정 파일을 하나라도 읽지 못하면 지우지 않습니다 */
export async function removeUnusedImages(
	dataDir: string,
	imagesDir: string,
	file: DataFile,
): Promise<void> {
	const referenced = await collectReferencedImages(dataDir, file);
	if (!referenced) return;

	for (const kind of IMAGE_KINDS_BY_FILE[file]) {
		const dir = path.join(imagesDir, kind);
		const fileNames = await readdir(dir).catch(() => []);
		for (const fileName of fileNames) {
			if (referenced.has(`images/${kind}/${fileName}`)) continue;
			await unlink(path.join(dir, fileName)).catch(() => undefined);
		}
	}
}

export async function removeAllUnusedImages(dataDir: string, imagesDir: string): Promise<void> {
	for (const file of DATA_FILES) {
		await removeUnusedImages(dataDir, imagesDir, file);
	}
}

/** cavac://images/<kind>/<uuid>.<ext> 를 imagesDir 안의 파일 경로로 바꿉니다. 다른 모양이면 undefined */
export function resolveImageUrl(imagesDir: string, url: string): string | undefined {
	try {
		const { host, pathname } = new URL(url);
		const imagePath = `images${decodeURIComponent(pathname)}`;
		if (host !== "images" || !isImagePath(imagePath)) return undefined;
		return path.join(imagesDir, ...imagePath.split("/").slice(1));
	} catch {
		return undefined;
	}
}
