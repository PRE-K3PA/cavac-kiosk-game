import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createDefaultData } from "@/data/defaults";
import { LIMITS } from "@/data/schema";
import * as storage from "@/data/storage";
import type { ImageKind, ImagePath, ImageResult, Localized, ProductSlot } from "@/types/data";

const postImage = mock<(kind: ImageKind) => Promise<ImageResult>>();

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getImageUrl: (path: string) => `file://${path}`,
	postImage,
}));

const { IMAGE_ERROR_MESSAGES } = await import("@/features/admin/imageUpload");
const { useSettingsDraft } = await import("@/features/admin/settingsDraft");
const { default: ProductFormOverlay } = await import("@/pages/admin/ProductFormOverlay");

function productImage(slot: number): Localized<ImagePath> {
	return { ko: `product-${slot}-ko.png`, en: `product-${slot}-en.png` };
}

// 수정이 사진만 바꾸고 사용·결과 화면 표시는 그대로 두는지 보려고 기본값과 다르게 채웁니다
const EXISTING: ProductSlot = {
	slot: 2,
	image: productImage(2),
	isEnabled: false,
	isShownInResult: false,
};

/** 1·3번은 켜진 제품, 2번은 EXISTING, 4번부터는 빈 칸입니다 */
function createProducts(): ProductSlot[] {
	return createDefaultData("card-game").products.map((product) => {
		if (product.slot === EXISTING.slot) return EXISTING;
		if (product.slot > 3) return product;
		return { ...product, image: productImage(product.slot), isEnabled: true };
	});
}

const REQUIRED_NOTICE = "KR·EN 이미지가 모두 필요합니다.";

function resetSettingsDraft() {
	useSettingsDraft.setState(useSettingsDraft.getInitialState(), true);
}

function setProducts(products: ProductSlot[]) {
	const initialState = useSettingsDraft.getInitialState();
	const { draft } = initialState;
	const data = { ...draft, "card-game": { ...draft["card-game"], products } };
	useSettingsDraft.setState({ ...initialState, original: data, draft: data }, true);
}

function getProducts() {
	return useSettingsDraft.getState().draft["card-game"].products;
}

function getButton(name: string) {
	return screen.getByRole<HTMLButtonElement>("button", { name });
}

/** KR, EN 순서로 그려지는 "파일 선택" 버튼 */
function getImageSelectButtons() {
	return screen.getAllByRole("button", { name: "파일 선택" });
}

/** "파일 선택" 버튼이 든 사진 칸. 왼쪽에 고른 사진, 버튼 아래에 오류 문구가 있습니다 */
function getImageField(selectButton: HTMLElement) {
	const field = selectButton.parentElement?.parentElement;
	if (!field) throw new Error("사진 칸을 찾을 수 없습니다");
	// 칸 범위가 넓어져 옆 칸의 사진·문구를 보고 조용히 통과하지 않게, 버튼이 하나뿐인지 확인합니다
	if (within(field).queryAllByRole("button", { name: "파일 선택" }).length !== 1) {
		throw new Error("사진 칸이 한 칸보다 넓게 잡혔습니다");
	}
	return within(field);
}

function getImageSrc(selectButton: HTMLElement) {
	return getImageField(selectButton).getByRole("presentation").getAttribute("src");
}

/** 고르는 동안 누른 다른 칸은 무시되므로, 고른 사진이 그 칸에 보일 때까지 기다립니다 */
async function selectImage(selectButton: HTMLElement, path: string) {
	postImage.mockResolvedValueOnce({ status: "ok", path });
	fireEvent.click(selectButton);
	await waitFor(() => expect(getImageSrc(selectButton)).toBe(`file://${path}`));
}

async function selectBothImages() {
	const [koButton, enButton] = getImageSelectButtons();
	await selectImage(koButton, "picked-ko.png");
	await selectImage(enButton, "picked-en.png");
}

/** 취소처럼 끝나도 화면이 바뀌지 않는 고르기는 act 로 비동기 처리가 끝날 때까지 기다립니다 */
async function clickAndSettle(button: HTMLElement) {
	await act(async () => {
		fireEvent.click(button);
	});
}

function getRequestedImageKinds() {
	return postImage.mock.calls.map(([kind]) => kind);
}

const onCancel = mock<() => void>();
const onDone = mock<() => void>();

function renderAdd() {
	render(<ProductFormOverlay onCancel={onCancel} onDone={onDone} />);
}

function renderEdit(product: ProductSlot) {
	render(<ProductFormOverlay product={product} onCancel={onCancel} onDone={onDone} />);
}

beforeEach(() => {
	postImage.mockReset();
	onCancel.mockClear();
	onDone.mockClear();
	setProducts(createProducts());
});

afterEach(() => {
	cleanup();
	resetSettingsDraft();
});

describe("제품 등록", () => {
	test("첫 빈 칸 번호로 열리고 삭제 버튼이 없다", () => {
		renderAdd();

		expect(screen.getByRole("heading", { name: "제품 등록" })).toBeTruthy();
		expect(screen.getByText(`4번 칸 · ${REQUIRED_NOTICE}`)).toBeTruthy();
		expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
	});

	test("KR·EN 사진을 모두 골라야 확인이 풀리고, 제품 사진으로 고른다", async () => {
		renderAdd();
		const [koButton, enButton] = getImageSelectButtons();
		expect(getButton("확인").disabled).toBe(true);

		await selectImage(koButton, "picked-ko.png");
		expect(getButton("확인").disabled).toBe(true);

		await selectImage(enButton, "picked-en.png");
		expect(getButton("확인").disabled).toBe(false);
		expect(getRequestedImageKinds()).toEqual(["product", "product"]);
	});

	test("확인을 누르면 초안의 첫 빈 칸에 제품이 들어가고 onDone 이 불린다", async () => {
		const before = getProducts();
		renderAdd();
		await selectBothImages();

		fireEvent.click(getButton("확인"));

		expect(getProducts()).toEqual(
			before.map((product) =>
				product.slot === 4
					? { ...product, image: { ko: "picked-ko.png", en: "picked-en.png" }, isEnabled: true }
					: product,
			),
		);
		expect(onDone).toHaveBeenCalledTimes(1);
		expect(onCancel).not.toHaveBeenCalled();
	});

	test("취소를 누르면 초안은 그대로고 onCancel 만 불린다", async () => {
		const before = getProducts();
		renderAdd();
		await selectBothImages();

		fireEvent.click(getButton("취소"));

		expect(getProducts()).toEqual(before);
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onDone).not.toHaveBeenCalled();
	});
});

describe("제품 수정", () => {
	test("그 칸 번호와 기존 사진을 채운 채로 열리고 확인이 바로 풀린다", () => {
		renderEdit(EXISTING);

		expect(screen.getByRole("heading", { name: "제품 수정" })).toBeTruthy();
		expect(screen.getByText(`2번 칸 · ${REQUIRED_NOTICE}`)).toBeTruthy();
		const [koButton, enButton] = getImageSelectButtons();
		expect(getImageSrc(koButton)).toBe("file://product-2-ko.png");
		expect(getImageSrc(enButton)).toBe("file://product-2-en.png");
		expect(getButton("확인").disabled).toBe(false);
		expect(getButton("삭제")).toBeTruthy();
	});

	test("사진을 바꿔 확인하면 그 칸 사진만 바뀌고 사용·결과 화면 표시와 다른 칸은 그대로다", async () => {
		const before = getProducts();
		renderEdit(EXISTING);
		const [koButton] = getImageSelectButtons();

		await selectImage(koButton, "new-ko.png");
		fireEvent.click(getButton("확인"));

		expect(getProducts()).toEqual(
			before.map((product) =>
				product.slot === 2
					? { ...EXISTING, image: { ...productImage(2), ko: "new-ko.png" } }
					: product,
			),
		);
		expect(getRequestedImageKinds()).toEqual(["product"]);
		expect(onDone).toHaveBeenCalledTimes(1);
	});

	test("사진을 바꾸고 취소하면 초안은 그대로고 onCancel 만 불린다", async () => {
		const before = getProducts();
		renderEdit(EXISTING);
		const [koButton] = getImageSelectButtons();

		await selectImage(koButton, "new-ko.png");
		fireEvent.click(getButton("취소"));

		expect(getProducts()).toEqual(before);
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onDone).not.toHaveBeenCalled();
	});

	test("삭제를 누르면 삭제 확인 창이 열리고, 취소하면 확인 창만 닫힌다", () => {
		const before = getProducts();
		renderEdit(EXISTING);

		fireEvent.click(getButton("삭제"));
		const dialogs = screen.getAllByRole("dialog");
		expect(dialogs).toHaveLength(2);
		expect(within(dialogs[1]).getByText("2번 칸")).toBeTruthy();

		fireEvent.click(within(dialogs[1]).getByRole("button", { name: "취소" }));

		expect(screen.getAllByRole("dialog")).toHaveLength(1);
		expect(screen.getByRole("heading", { name: "제품 수정" })).toBeTruthy();
		expect(getProducts()).toEqual(before);
		expect(onDone).not.toHaveBeenCalled();
		expect(onCancel).not.toHaveBeenCalled();
	});

	test("삭제 확인에서 삭제를 누르면 그 제품이 지워지고 아래 제품이 올라오며 onDone 이 불린다", () => {
		renderEdit(EXISTING);

		fireEvent.click(getButton("삭제"));
		const dialog = screen.getAllByRole("dialog")[1];
		fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));

		expect(getProducts().map(({ image }) => image)).toEqual([
			productImage(1),
			productImage(3),
			...Array.from({ length: LIMITS.productSlots - 2 }, () => null),
		]);
		expect(onDone).toHaveBeenCalledTimes(1);
		expect(onCancel).not.toHaveBeenCalled();
	});
});

describe("사진 고르기", () => {
	test("취소하면 그 칸은 비어 있고, 다시 눌러 고를 수 있다", async () => {
		renderAdd();
		const [koButton] = getImageSelectButtons();

		postImage.mockResolvedValueOnce({ status: "cancel" });
		await clickAndSettle(koButton);
		expect(screen.queryByRole("button", { name: "미리보기" })).toBeNull();

		await selectImage(koButton, "picked-ko.png");
		expect(getImageField(koButton).getByRole("button", { name: "미리보기" })).toBeTruthy();
	});

	test("실패하면 누른 칸에만 오류 문구를 보여 주고, 다시 고르면 문구가 사라진다", async () => {
		renderAdd();
		const [koButton, enButton] = getImageSelectButtons();

		postImage.mockResolvedValueOnce({ status: "error", reason: "size" });
		fireEvent.click(koButton);

		expect(await getImageField(koButton).findByText(IMAGE_ERROR_MESSAGES.size)).toBeTruthy();
		expect(getImageField(enButton).queryByText(IMAGE_ERROR_MESSAGES.size)).toBeNull();

		await selectImage(koButton, "picked-ko.png");
		expect(screen.queryByText(IMAGE_ERROR_MESSAGES.size)).toBeNull();
	});
});
