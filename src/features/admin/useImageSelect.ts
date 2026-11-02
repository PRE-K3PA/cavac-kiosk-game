import { useState } from "react";
import { IMAGE_ERROR_MESSAGES, selectImage } from "@/features/admin/imageUpload";
import type { ImageKind, ImagePath } from "@/types/data";

// 타입 인자를 빼먹으면 Field 가 string 이 되어 칸 이름 오타를 못 잡으므로 never 로 막습니다
export function useImageSelect<Field extends string = never>() {
	const [isSelecting, setIsSelecting] = useState(false);
	const [errorMessages, setErrorMessages] = useState<Partial<Record<Field, string>>>({});

	function setErrorMessage(field: Field, message?: string) {
		setErrorMessages((current) => ({ ...current, [field]: message }));
	}

	async function selectImageFor(field: Field, kind: ImageKind): Promise<ImagePath | undefined> {
		if (isSelecting) return;
		setIsSelecting(true);
		const result = await selectImage(kind);
		setIsSelecting(false);

		if (result.status === "cancel") return;
		if (result.status === "error") {
			setErrorMessage(field, IMAGE_ERROR_MESSAGES[result.reason]);
			return;
		}
		setErrorMessage(field, undefined);
		return result.path;
	}

	return { isSelecting, errorMessages, setErrorMessage, selectImageFor };
}
