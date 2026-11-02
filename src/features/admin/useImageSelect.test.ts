import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import * as storage from "@/data/storage";
import type { ImageKind, ImagePath, ImageResult } from "@/types/data";

const postImage = mock<(kind: ImageKind) => Promise<ImageResult>>();

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 postImage 만 바꾸고 나머지는 그대로 둡니다
mock.module("@/data/storage", () => ({ ...storage, postImage }));

const { IMAGE_ERROR_MESSAGES } = await import("@/features/admin/imageUpload");
const { useImageSelect } = await import("@/features/admin/useImageSelect");

type Field = "ko" | "en";

const PICKED_PATH = "images/product/picked.png";
const EMPTY_MESSAGE = "사진을 등록해 주세요.";

function renderImageSelect() {
	return renderHook(() => useImageSelect<Field>());
}

type ImageSelect = ReturnType<typeof renderImageSelect>["result"];

async function selectImageFor(result: ImageSelect, field: Field) {
	let path: ImagePath | undefined;
	await act(async () => {
		path = await result.current.selectImageFor(field, "product");
	});
	return path;
}

function setErrorMessage(result: ImageSelect, field: Field, message?: string) {
	act(() => result.current.setErrorMessage(field, message));
}

beforeEach(() => {
	postImage.mockReset();
});

afterEach(cleanup);

describe("useImageSelect", () => {
	test("고르면 경로를 돌려주고 그 칸의 오류 문구를 지운다", async () => {
		postImage.mockResolvedValue({ status: "ok", path: PICKED_PATH });
		const { result } = renderImageSelect();
		setErrorMessage(result, "ko", EMPTY_MESSAGE);

		expect(await selectImageFor(result, "ko")).toBe(PICKED_PATH);
		expect(postImage).toHaveBeenCalledWith("product");
		expect(result.current.errorMessages.ko).toBeUndefined();
		expect(result.current.isSelecting).toBe(false);
	});

	test("취소하면 아무것도 돌려주지 않고 오류 문구를 그대로 둔다", async () => {
		postImage.mockResolvedValue({ status: "cancel" });
		const { result } = renderImageSelect();
		setErrorMessage(result, "ko", EMPTY_MESSAGE);

		expect(await selectImageFor(result, "ko")).toBeUndefined();
		expect(result.current.errorMessages.ko).toBe(EMPTY_MESSAGE);
		expect(result.current.isSelecting).toBe(false);
	});

	test.each(["format", "size", "io"] as const)(
		"%s 오류는 그 칸에만 문구를 넣는다",
		async (reason) => {
			postImage.mockResolvedValue({ status: "error", reason });
			const { result } = renderImageSelect();

			expect(await selectImageFor(result, "ko")).toBeUndefined();
			expect(result.current.errorMessages).toEqual({ ko: IMAGE_ERROR_MESSAGES[reason] });
			expect(result.current.isSelecting).toBe(false);
		},
	);

	test("파일을 열다 예외가 나면 io 문구를 넣는다", async () => {
		postImage.mockRejectedValue(new Error("열기 실패"));
		const { result } = renderImageSelect();

		expect(await selectImageFor(result, "ko")).toBeUndefined();
		expect(result.current.errorMessages.ko).toBe(IMAGE_ERROR_MESSAGES.io);
		expect(result.current.isSelecting).toBe(false);
	});

	test("한 칸의 결과는 다른 칸의 오류 문구를 바꾸지 않는다", async () => {
		const { result } = renderImageSelect();
		setErrorMessage(result, "en", EMPTY_MESSAGE);

		postImage.mockResolvedValue({ status: "error", reason: "size" });
		await selectImageFor(result, "ko");
		postImage.mockResolvedValue({ status: "ok", path: PICKED_PATH });
		await selectImageFor(result, "ko");

		expect(result.current.errorMessages.ko).toBeUndefined();
		expect(result.current.errorMessages.en).toBe(EMPTY_MESSAGE);
	});

	test("고르는 동안 잠그고, 그사이 다시 눌러도 파일 창은 한 번만 연다", async () => {
		let finishSelect: (result: ImageResult) => void = () => {};
		postImage.mockImplementation(
			() =>
				new Promise((resolve) => {
					finishSelect = resolve;
				}),
		);
		const { result } = renderImageSelect();
		let first: Promise<ImagePath | undefined> = Promise.resolve(undefined);

		act(() => {
			first = result.current.selectImageFor("ko", "product");
		});

		expect(result.current.isSelecting).toBe(true);
		expect(await selectImageFor(result, "en")).toBeUndefined();
		expect(postImage).toHaveBeenCalledTimes(1);

		await act(async () => {
			finishSelect({ status: "ok", path: PICKED_PATH });
			await first;
		});

		expect(await first).toBe(PICKED_PATH);
		expect(result.current.isSelecting).toBe(false);
	});

	test("setErrorMessage 로 넣은 문구를 지울 수 있다", () => {
		const { result } = renderImageSelect();

		setErrorMessage(result, "ko", EMPTY_MESSAGE);
		expect(result.current.errorMessages.ko).toBe(EMPTY_MESSAGE);

		setErrorMessage(result, "ko");
		expect(result.current.errorMessages.ko).toBeUndefined();
	});
});
