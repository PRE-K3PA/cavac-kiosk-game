import { LIMITS } from "@/data/schema";
import { postImage } from "@/data/storage";
import type { ImageKind, ImageResult } from "@/types/data";

type ImageErrorReason = Extract<ImageResult, { status: "error" }>["reason"];

const IMAGE_MAX_MB = LIMITS.imageMaxBytes / 1024 / 1024;

export const IMAGE_ERROR_MESSAGES: Record<ImageErrorReason, string> = {
	format: "PNG·JPG만 올릴 수 있습니다",
	size: `${IMAGE_MAX_MB}MB 이하만 올릴 수 있습니다`,
	io: "이미지를 불러오지 못했습니다",
};

export async function selectImage(kind: ImageKind): Promise<ImageResult> {
	try {
		return await postImage(kind);
	} catch {
		return { status: "error", reason: "io" };
	}
}
