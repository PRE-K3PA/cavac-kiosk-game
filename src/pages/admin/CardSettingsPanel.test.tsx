import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createDefaultData } from "@/data/defaults";
import { LIMITS } from "@/data/schema";
import * as storage from "@/data/storage";
import type {
	CardGameData,
	ImageKind,
	ImagePath,
	ImageResult,
	Localized,
	PairCount,
	ProductSlot,
} from "@/types/data";

const postImage = mock<(kind: ImageKind) => Promise<ImageResult>>();

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getImageUrl: (path: string) => `file://${path}`,
	postImage,
}));

const { useSettingsDraft } = await import("@/features/admin/settingsDraft");
const { default: CardSettingsPanel } = await import("@/pages/admin/CardSettingsPanel");

const PAIR_COUNT_6_LIMIT_NOTICE = "이미 6개를 모두 켰습니다. 다른 제품을 끈 뒤 켜 주세요.";

function productImage(slot: number): Localized<ImagePath> {
	return { ko: `product-${slot}-ko.png`, en: `product-${slot}-en.png` };
}

/** 1번부터 filledCount 칸에 사진을 넣고, enabledSlots 칸만 켭니다. 나머지는 빈 칸입니다 */
function createProducts(filledCount: number, enabledSlots: readonly number[]): ProductSlot[] {
	return createDefaultData("card-game").products.map((product) =>
		product.slot <= filledCount
			? {
					...product,
					image: productImage(product.slot),
					isEnabled: enabledSlots.includes(product.slot),
				}
			: product,
	);
}

function slotsUpTo(count: number) {
	return Array.from({ length: count }, (_, index) => index + 1);
}

function resetSettingsDraft() {
	useSettingsDraft.setState(useSettingsDraft.getInitialState(), true);
}

/** 원본과 초안을 같은 카드 설정으로 맞춥니다. 저장 여부(dirty)는 이 테스트의 관심사가 아닙니다 */
function setCardGame(settings: Partial<CardGameData["settings"]>, products: ProductSlot[]) {
	const initialState = useSettingsDraft.getInitialState();
	const { draft } = initialState;
	const base = draft["card-game"];
	const card = { settings: { ...base.settings, ...settings }, products };
	const data = { ...draft, "card-game": card };
	useSettingsDraft.setState({ ...initialState, original: data, draft: data }, true);
}

function getCard() {
	return useSettingsDraft.getState().draft["card-game"];
}

/** 칸 번호 순서의 KR 사진 경로. 빈 칸은 null */
function getProductImagesKo() {
	return getCard().products.map((product) => product.image?.ko ?? null);
}

/** 사진이 든 칸들의 KR 사진 경로를 차례로 놓고, 나머지 칸은 빈 칸(null)으로 채웁니다 */
function toImagesKo(filledSlots: number[]) {
	const empty = Array.from({ length: LIMITS.productSlots - filledSlots.length }, () => null);
	return [...filledSlots.map((slot) => productImage(slot).ko), ...empty];
}

function getEnabledSlots() {
	return getCard()
		.products.filter((product) => product.isEnabled)
		.map((product) => product.slot);
}

function getButton(name: string) {
	return screen.getByRole<HTMLButtonElement>("button", { name });
}

function getPairCountButton(count: PairCount) {
	return getButton(`${count}쌍 카드 ${count * 2}장`);
}

function getEnabledCheckbox(slot: number) {
	return screen.getByRole<HTMLInputElement>("checkbox", { name: `${slot}번 제품 사용` });
}

function getShownInResultCheckbox(slot: number) {
	return screen.getByRole<HTMLInputElement>("checkbox", { name: `${slot}번 제품 결과 화면 표시` });
}

/** 행마다 이름이 같은 수정·삭제·등록 버튼을, 칸 번호가 든 사용 체크의 행으로 좁혀 찾습니다 */
function getProductRow(slot: number) {
	const row = getEnabledCheckbox(slot).closest("div");
	if (!row) throw new Error(`${slot}번 제품 행을 찾을 수 없습니다`);
	// 행보다 넓게 잡히면 목록에 하나뿐인 버튼을 찾아 조용히 통과하므로, 사용 체크가 하나뿐인지 확인합니다
	if (within(row).queryAllByRole("checkbox", { name: /번 제품 사용$/ }).length !== 1) {
		throw new Error(`${slot}번 제품 행이 한 행보다 넓게 잡혔습니다`);
	}
	return within(row);
}

function getDialog() {
	return within(screen.getByRole("dialog"));
}

/** 고르는 동안 누른 다른 칸은 무시되므로, 한 칸이 미리보기까지 끝난 뒤 다음 칸을 누릅니다 */
async function selectImages(paths: string[]) {
	const buttons = screen.getAllByRole("button", { name: "파일 선택" });
	for (const [index, path] of paths.entries()) {
		postImage.mockResolvedValueOnce({ status: "ok", path });
		fireEvent.click(buttons[index]);
		await waitFor(() =>
			expect(screen.getAllByRole("button", { name: "미리보기" })).toHaveLength(index + 1),
		);
	}
}

function renderPanel() {
	render(<CardSettingsPanel />);
}

beforeEach(() => {
	postImage.mockReset();
	setCardGame({ pairCount: 8 }, createProducts(10, slotsUpTo(8)));
});

afterEach(() => {
	cleanup();
	resetSettingsDraft();
});

describe("카드 쌍 수", () => {
	test("쌍 수를 누르면 초안에 반영되고, 사진 있는 칸을 1번부터 쌍 수만큼 켠다", () => {
		setCardGame({ pairCount: 6 }, createProducts(10, [5, 6, 7, 8, 9, 10]));
		renderPanel();
		expect(getPairCountButton(6).getAttribute("aria-pressed")).toBe("true");

		fireEvent.click(getPairCountButton(8));
		expect(getCard().settings.pairCount).toBe(8);
		expect(getEnabledSlots()).toEqual(slotsUpTo(8));
		expect(getPairCountButton(8).getAttribute("aria-pressed")).toBe("true");
		expect(getPairCountButton(6).getAttribute("aria-pressed")).toBe("false");
		expect(getEnabledCheckbox(1).checked).toBe(true);
		expect(getEnabledCheckbox(9).checked).toBe(false);
		expect(screen.getByText("사용 8 / 8")).toBeTruthy();

		fireEvent.click(getPairCountButton(10));
		expect(getCard().settings.pairCount).toBe(10);
		expect(getEnabledSlots()).toEqual(slotsUpTo(10));
		expect(screen.getByText("사용 10 / 10")).toBeTruthy();

		fireEvent.click(getPairCountButton(6));
		expect(getCard().settings.pairCount).toBe(6);
		expect(getEnabledSlots()).toEqual(slotsUpTo(6));
		expect(screen.getByText("사용 6 / 6")).toBeTruthy();
	});
});

describe("제품 사용", () => {
	test("체크를 바꾸면 초안에 반영되고 사용 수가 바뀐다", () => {
		setCardGame({ pairCount: 8 }, createProducts(10, slotsUpTo(7)));
		renderPanel();
		expect(screen.getByText("사용 7 / 8")).toBeTruthy();

		fireEvent.click(getEnabledCheckbox(8));
		expect(getEnabledSlots()).toEqual(slotsUpTo(8));
		expect(getEnabledCheckbox(8).checked).toBe(true);
		expect(screen.getByText("사용 8 / 8")).toBeTruthy();

		fireEvent.click(getEnabledCheckbox(1));
		expect(getEnabledSlots()).toEqual([2, 3, 4, 5, 6, 7, 8]);
		expect(getEnabledCheckbox(1).checked).toBe(false);
		expect(screen.getByText("사용 7 / 8")).toBeTruthy();
	});

	test("쌍 수만큼 켠 상태에서 더 켜면 초안은 그대로고 한도 안내를 보여 준다", () => {
		setCardGame({ pairCount: 6 }, createProducts(10, slotsUpTo(6)));
		const before = getCard();
		renderPanel();

		fireEvent.click(getEnabledCheckbox(7));

		expect(getCard()).toEqual(before);
		expect(getEnabledCheckbox(7).checked).toBe(false);
		expect(screen.getByRole("status").textContent).toBe(PAIR_COUNT_6_LIMIT_NOTICE);
	});

	// 끄는 순간에는 "켜진 제품이 모자랍니다" 안내가 앞서 보이므로, 다시 켰을 때 한도 안내가 없어야 합니다
	test("한도 안내는 제품을 끄면 사라지고, 끈 제품을 다시 켜도 나오지 않는다", () => {
		setCardGame({ pairCount: 6 }, createProducts(10, slotsUpTo(6)));
		renderPanel();
		fireEvent.click(getEnabledCheckbox(7));
		expect(screen.getByRole("status").textContent).toBe(PAIR_COUNT_6_LIMIT_NOTICE);

		fireEvent.click(getEnabledCheckbox(1));
		expect(screen.getByRole("status").textContent).toBe(
			"켜진 제품이 1개 모자랍니다. 1개를 더 켜 주세요.",
		);

		fireEvent.click(getEnabledCheckbox(1));
		expect(getEnabledSlots()).toEqual(slotsUpTo(6));
		expect(screen.queryByRole("status")).toBeNull();
	});

	test("한도 안내는 쌍 수를 바꾸면 사라진다", () => {
		setCardGame({ pairCount: 6 }, createProducts(10, slotsUpTo(6)));
		renderPanel();
		fireEvent.click(getEnabledCheckbox(7));
		expect(screen.getByRole("status").textContent).toBe(PAIR_COUNT_6_LIMIT_NOTICE);

		fireEvent.click(getPairCountButton(8));

		expect(getEnabledSlots()).toEqual(slotsUpTo(8));
		expect(screen.queryByRole("status")).toBeNull();
	});
});

describe("결과 화면 표시", () => {
	test("체크를 바꾸면 그 제품만 초안에 반영된다", () => {
		renderPanel();

		fireEvent.click(getShownInResultCheckbox(1));
		expect(getCard().products[0].isShownInResult).toBe(false);
		expect(getCard().products[1].isShownInResult).toBe(true);
		expect(getShownInResultCheckbox(1).checked).toBe(false);

		fireEvent.click(getShownInResultCheckbox(1));
		expect(getCard().products[0].isShownInResult).toBe(true);
		expect(getShownInResultCheckbox(1).checked).toBe(true);
	});
});

describe("오답 패널티", () => {
	test("바꾼 값이 카드 초안에 들어가고, 값을 비운 채 끄면 카드 설정 원본의 값으로 되돌린다", () => {
		setCardGame(
			{
				pairCount: 8,
				penalty: { time: { isEnabled: true, seconds: 7 }, score: { isEnabled: false, points: 50 } },
			},
			createProducts(10, slotsUpTo(8)),
		);
		// 원본(7초)과 패널을 열 때의 초안(5초)을 달리 두어, 되돌리는 값이 원본에서 오는지 가립니다
		useSettingsDraft.setState((state) => {
			const card = state.draft["card-game"];
			const penalty = { ...card.settings.penalty, time: { isEnabled: true, seconds: 5 } };
			const settings = { ...card.settings, penalty };
			return { draft: { ...state.draft, "card-game": { ...card, settings } } };
		});
		const vaccinePenalty = useSettingsDraft.getState().draft["vaccine-game"].settings.penalty;
		renderPanel();
		const timeInput = screen.getByRole<HTMLInputElement>("textbox", { name: "시간 차감" });
		expect(timeInput.value).toBe("5");

		fireEvent.change(timeInput, { target: { value: "9" } });
		expect(getCard().settings.penalty.time.seconds).toBe(9);

		fireEvent.change(timeInput, { target: { value: "" } });
		fireEvent.click(screen.getByRole("checkbox", { name: "시간 차감" }));
		expect(getCard().settings.penalty.time).toEqual({ isEnabled: false, seconds: 7 });
		expect(useSettingsDraft.getState().draft["vaccine-game"].settings.penalty).toEqual(
			vaccinePenalty,
		);
	});
});

describe("제품 등록·수정·삭제 창", () => {
	test("첫 빈 칸에만 등록 버튼이 있고, 누르면 그 칸 번호로 등록 창이 열린다", () => {
		renderPanel();
		expect(screen.getAllByRole("button", { name: "등록" })).toHaveLength(1);

		fireEvent.click(getProductRow(11).getByRole("button", { name: "등록" }));

		// 패널의 "제품 등록" 섹션 제목과 겹치지 않게 창 안에서 찾습니다
		expect(getDialog().getByRole("heading", { name: "제품 등록" })).toBeTruthy();
		expect(getDialog().getByText("11번 칸 · KR·EN 이미지가 모두 필요합니다.")).toBeTruthy();
	});

	test("등록 창에서 사진을 골라 확인하면 그 칸에 제품이 들어가고 창이 닫힌다", async () => {
		renderPanel();
		fireEvent.click(getButton("등록"));
		await selectImages(["picked-ko.png", "picked-en.png"]);

		fireEvent.click(getButton("확인"));

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getCard().products[10].image).toEqual({ ko: "picked-ko.png", en: "picked-en.png" });
		expect(getProductRow(11).getByRole("button", { name: "수정" })).toBeTruthy();
		expect(getProductRow(12).getByRole("button", { name: "등록" })).toBeTruthy();
	});

	test("등록 창에서 취소하면 초안은 그대로고 창이 닫힌다", () => {
		const before = getCard();
		renderPanel();
		fireEvent.click(getButton("등록"));

		fireEvent.click(getButton("취소"));

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getCard()).toEqual(before);
	});

	test("행의 수정을 누르면 그 칸의 사진으로 수정 창이 열리고, 확인하면 창이 닫힌다", () => {
		const before = getCard();
		renderPanel();

		fireEvent.click(getProductRow(3).getByRole("button", { name: "수정" }));

		expect(getDialog().getByRole("heading", { name: "제품 수정" })).toBeTruthy();
		expect(getDialog().getByText("3번 칸 · KR·EN 이미지가 모두 필요합니다.")).toBeTruthy();
		const imageSrcs = getDialog()
			.getAllByRole("presentation")
			.map((image) => image.getAttribute("src"));
		expect(imageSrcs).toEqual(["file://product-3-ko.png", "file://product-3-en.png"]);

		fireEvent.click(getButton("확인"));

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getCard()).toEqual(before);
	});

	test("행의 삭제는 확인 창에서 삭제를 눌러야 지우고 아래 제품을 올리며, 취소하면 그대로 둔다", () => {
		const before = getCard();
		renderPanel();
		const deleteButton = getProductRow(2).getByRole("button", { name: "삭제" });

		fireEvent.click(deleteButton);
		expect(getDialog().getByText("2번 칸")).toBeTruthy();
		fireEvent.click(getDialog().getByRole("button", { name: "취소" }));
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getCard()).toEqual(before);

		fireEvent.click(deleteButton);
		fireEvent.click(getDialog().getByRole("button", { name: "삭제" }));
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getProductImagesKo()).toEqual(toImagesKo([1, 3, 4, 5, 6, 7, 8, 9, 10]));
		expect(getProductRow(10).getByRole("button", { name: "등록" })).toBeTruthy();
	});

	test("수정 창에서 삭제를 확정하면 창이 모두 닫히고 그 제품이 초안에서 빠진다", () => {
		renderPanel();
		fireEvent.click(getProductRow(3).getByRole("button", { name: "수정" }));

		const formDialog = screen.getAllByRole("dialog")[0];
		fireEvent.click(within(formDialog).getByRole("button", { name: "삭제" }));
		const confirmDialog = screen.getAllByRole("dialog")[1];
		fireEvent.click(within(confirmDialog).getByRole("button", { name: "삭제" }));

		expect(screen.queryAllByRole("dialog")).toHaveLength(0);
		expect(getProductImagesKo()).toEqual(toImagesKo([1, 2, 4, 5, 6, 7, 8, 9, 10]));
	});
});
