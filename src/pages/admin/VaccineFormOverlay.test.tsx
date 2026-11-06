import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import * as storage from "@/data/storage";
import type { ImageKind, ImageResult, Vaccine } from "@/types/data";

const postImage = mock<(kind: ImageKind) => Promise<ImageResult>>();

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getImageUrl: (path: string) => `file://${path}`,
	postImage,
}));

const { IMAGE_ERROR_MESSAGES } = await import("@/features/admin/imageUpload");
const { useSettingsDraft } = await import("@/features/admin/settingsDraft");
const { default: VaccineFormOverlay } = await import("@/pages/admin/VaccineFormOverlay");

function createVaccine(id: string, overrides: Partial<Vaccine> = {}): Vaccine {
	return {
		id,
		brandName: { ko: "브랜드", en: "Brand" },
		productName: { ko: "제품", en: "Product" },
		bottleImage: { ko: `${id}-bottle-ko.png`, en: `${id}-bottle-en.png` },
		logoImage: { ko: `${id}-logo-ko.png`, en: `${id}-logo-en.png` },
		isEnabled: true,
		antigens: [],
		...overrides,
	};
}

// 수정이 이름·사진만 바꾸고 사용 여부·항원은 그대로 두는지 보려고 기본값과 다르게 채웁니다
const EXISTING = createVaccine("circo", {
	brandName: { ko: "써코컴", en: "CircoComb" },
	productName: { ko: "써코백", en: "Circovac" },
	isEnabled: false,
	antigens: [{ id: "pcv2", abbr: "PCV2", subtype: null, pathogenType: "virus", isPinned: true }],
});
const OTHER = createVaccine("flu", { productName: { ko: "플루백", en: "Fluvac" } });

/** 백신 이미지 KR·EN, 백신 로고 KR·EN 칸에 차례로 고를 경로 */
const PICKED_PATHS = ["bottle-ko.png", "bottle-en.png", "logo-ko.png", "logo-en.png"];

function resetSettingsDraft() {
	useSettingsDraft.setState(useSettingsDraft.getInitialState(), true);
}

function setVaccines(vaccines: Vaccine[]) {
	const initialState = useSettingsDraft.getInitialState();
	const { draft } = initialState;
	const data = { ...draft, "vaccine-game": { ...draft["vaccine-game"], vaccines } };
	useSettingsDraft.setState({ ...initialState, original: data, draft: data }, true);
}

function getVaccines() {
	return useSettingsDraft.getState().draft["vaccine-game"].vaccines;
}

function getVaccine(vaccineId: string) {
	const vaccine = getVaccines().find((item) => item.id === vaccineId);
	if (vaccine === undefined) throw new Error(`초안에 ${vaccineId} 백신이 없습니다`);
	return vaccine;
}

function getButton(name: string) {
	return screen.getByRole<HTMLButtonElement>("button", { name });
}

/** 백신 이미지 KR·EN, 백신 로고 KR·EN 순서로 그려지는 "파일 선택" 버튼 */
function getImageSelectButtons() {
	return screen.getAllByRole("button", { name: "파일 선택" });
}

/** "파일 선택" 버튼이 든 사진 칸. 왼쪽에 고른 사진, 버튼 아래에 오류 문구가 있습니다 */
function getImageField(selectButton: HTMLElement) {
	const field = selectButton.parentElement?.parentElement;
	if (!field) throw new Error("사진 칸을 찾을 수 없습니다");
	return within(field);
}

/** 고르는 동안 누른 다른 칸은 무시되므로, 한 칸이 미리보기까지 끝난 뒤 다음 칸을 누릅니다 */
async function selectImages(paths: string[]) {
	const buttons = getImageSelectButtons();
	for (const [index, path] of paths.entries()) {
		postImage.mockResolvedValueOnce({ status: "ok", path });
		fireEvent.click(buttons[index]);
		await waitFor(() =>
			expect(screen.getAllByRole("button", { name: "미리보기" })).toHaveLength(index + 1),
		);
	}
}

/** 취소처럼 끝나도 화면이 바뀌지 않는 고르기는 act 로 비동기 처리가 끝날 때까지 기다립니다 */
async function clickAndSettle(button: HTMLElement) {
	await act(async () => {
		fireEvent.click(button);
	});
}

function typeText(name: string, value: string) {
	fireEvent.change(screen.getByRole("textbox", { name }), { target: { value } });
}

function fillValidName() {
	typeText("KR 브랜드명", "포울샷");
	typeText("EN 브랜드명", "Fowlshot");
	typeText("KR 제품명", "5280 ABBNE");
	typeText("EN 제품명", "5280 ABBNE");
}

const onCancel = mock<() => void>();
const onDone = mock<() => void>();
const onAdded = mock<(vaccineId: string) => void>();

function renderAdd() {
	render(<VaccineFormOverlay onCancel={onCancel} onDone={onDone} onAdded={onAdded} />);
}

function renderEdit(vaccine: Vaccine) {
	render(
		<VaccineFormOverlay vaccine={vaccine} onCancel={onCancel} onDone={onDone} onAdded={onAdded} />,
	);
}

beforeEach(() => {
	postImage.mockReset();
	onCancel.mockClear();
	onDone.mockClear();
	onAdded.mockClear();
});

afterEach(() => {
	cleanup();
	resetSettingsDraft();
});

describe("백신 추가", () => {
	test("이름과 사진을 모두 채워야 확인이 풀린다", async () => {
		renderAdd();
		expect(getButton("확인").disabled).toBe(true);

		fillValidName();
		expect(getButton("확인").disabled).toBe(true);

		await selectImages(PICKED_PATHS);
		expect(getButton("확인").disabled).toBe(false);

		typeText("KR 브랜드명", "");
		expect(getButton("확인").disabled).toBe(true);
	});

	test("사진 고르기를 취소하면 그 칸은 비어 있고, 다시 눌러 고를 수 있다", async () => {
		renderAdd();
		const [bottleKo] = getImageSelectButtons();

		postImage.mockResolvedValueOnce({ status: "cancel" });
		await clickAndSettle(bottleKo);
		expect(screen.queryByRole("button", { name: "미리보기" })).toBeNull();

		postImage.mockResolvedValueOnce({ status: "ok", path: "bottle-ko.png" });
		fireEvent.click(bottleKo);
		expect(await getImageField(bottleKo).findByRole("button", { name: "미리보기" })).toBeTruthy();
	});

	test("사진 고르기가 실패하면 누른 칸에만 오류 문구를 보여 주고, 다시 눌러 고를 수 있다", async () => {
		renderAdd();
		const [bottleKo, ...otherButtons] = getImageSelectButtons();

		postImage.mockResolvedValueOnce({ status: "error", reason: "size" });
		fireEvent.click(bottleKo);

		expect(await getImageField(bottleKo).findByText(IMAGE_ERROR_MESSAGES.size)).toBeTruthy();
		for (const button of otherButtons) {
			expect(getImageField(button).queryByText(IMAGE_ERROR_MESSAGES.size)).toBeNull();
		}

		postImage.mockResolvedValueOnce({ status: "ok", path: "bottle-ko.png" });
		fireEvent.click(bottleKo);
		expect(await getImageField(bottleKo).findByRole("button", { name: "미리보기" })).toBeTruthy();
		expect(screen.queryByText(IMAGE_ERROR_MESSAGES.size)).toBeNull();
	});

	test("확인을 누르면 초안 끝에 새 백신이 들어가고 onAdded 가 새 id 를 받는다", async () => {
		setVaccines([OTHER]);
		renderAdd();
		fillValidName();
		await selectImages(PICKED_PATHS);

		fireEvent.click(getButton("확인"));

		expect(getVaccines()).toHaveLength(2);
		const added = getVaccines().at(-1);
		expect(added).toMatchObject({
			brandName: { ko: "포울샷", en: "Fowlshot" },
			productName: { ko: "5280 ABBNE", en: "5280 ABBNE" },
			bottleImage: { ko: "bottle-ko.png", en: "bottle-en.png" },
			logoImage: { ko: "logo-ko.png", en: "logo-en.png" },
		});
		expect(onAdded).toHaveBeenCalledWith(added?.id);
		expect(onDone).not.toHaveBeenCalled();
	});

	test("취소를 누르면 초안은 그대로고 onCancel 만 불린다", () => {
		setVaccines([OTHER]);
		renderAdd();
		fillValidName();

		fireEvent.click(getButton("취소"));

		expect(getVaccines()).toEqual([OTHER]);
		expect(onCancel).toHaveBeenCalledTimes(1);
		expect(onDone).not.toHaveBeenCalled();
		expect(onAdded).not.toHaveBeenCalled();
	});

	test("add 모드에는 삭제 버튼이 없다", () => {
		renderAdd();
		expect(screen.queryByRole("button", { name: "삭제" })).toBeNull();
	});
});

describe("백신 수정", () => {
	test("기존 이름과 사진을 채운 채로 열린다", () => {
		setVaccines([EXISTING]);
		renderEdit(EXISTING);

		expect(screen.getByRole("heading", { name: "백신 수정" })).toBeTruthy();
		expect(
			screen.getByText(
				`${EXISTING.brandName.ko} ${EXISTING.productName.ko} · 모든 항목이 필수입니다.`,
			),
		).toBeTruthy();
		expect(screen.getByRole<HTMLInputElement>("textbox", { name: "KR 브랜드명" }).value).toBe(
			EXISTING.brandName.ko,
		);
		expect(screen.getByRole<HTMLInputElement>("textbox", { name: "EN 제품명" }).value).toBe(
			EXISTING.productName.en,
		);
		expect(screen.getAllByRole("button", { name: "미리보기" })).toHaveLength(4);
		expect(getButton("삭제")).toBeTruthy();
	});

	test("이름을 고치고 확인하면 그 백신의 이름만 바뀌고 onDone 이 불린다", () => {
		setVaccines([EXISTING, OTHER]);
		renderEdit(EXISTING);

		typeText("KR 브랜드명", "새이름");
		fireEvent.click(getButton("확인"));

		expect(getVaccine(EXISTING.id)).toEqual({
			...EXISTING,
			brandName: { ...EXISTING.brandName, ko: "새이름" },
		});
		expect(getVaccine(OTHER.id)).toEqual(OTHER);
		expect(onDone).toHaveBeenCalledTimes(1);
		expect(onAdded).not.toHaveBeenCalled();
	});

	test("사진 한 칸만 새로 고르고 확인하면 그 칸만 바뀐다", async () => {
		setVaccines([EXISTING]);
		renderEdit(EXISTING);
		const [bottleKo] = getImageSelectButtons();

		postImage.mockResolvedValueOnce({ status: "ok", path: "new-bottle-ko.png" });
		fireEvent.click(bottleKo);
		await waitFor(() =>
			expect(getImageField(bottleKo).getByRole("presentation").getAttribute("src")).toBe(
				"file://new-bottle-ko.png",
			),
		);
		fireEvent.click(getButton("확인"));

		expect(getVaccine(EXISTING.id)).toEqual({
			...EXISTING,
			bottleImage: { ko: "new-bottle-ko.png", en: EXISTING.bottleImage.en },
		});
		expect(onDone).toHaveBeenCalledTimes(1);
	});

	test("이름에 공백만 넣으면 그 칸에 오류 문구를 이어 붙이고 확인을 막는다", () => {
		setVaccines([EXISTING]);
		renderEdit(EXISTING);
		const input = screen.getByRole("textbox", { name: "KR 브랜드명" });

		fireEvent.change(input, { target: { value: "  " } });

		const messageId = input.getAttribute("aria-describedby") ?? "";
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(document.getElementById(messageId)?.textContent).toBe(
			"KR 브랜드명: 공백만 입력할 수 없습니다.",
		);
		expect(getButton("확인").disabled).toBe(true);
	});

	test("삭제를 누르면 삭제 확인 창이 열리고, 취소하면 폼으로 돌아간다", () => {
		setVaccines([EXISTING]);
		renderEdit(EXISTING);

		fireEvent.click(getButton("삭제"));
		const dialogs = screen.getAllByRole("dialog");
		expect(dialogs).toHaveLength(2);
		expect(within(dialogs[1]).getByText(EXISTING.productName.ko)).toBeTruthy();

		fireEvent.click(within(dialogs[1]).getByRole("button", { name: "취소" }));

		expect(screen.getAllByRole("dialog")).toHaveLength(1);
		expect(getVaccines()).toHaveLength(1);
		expect(onDone).not.toHaveBeenCalled();
		expect(onCancel).not.toHaveBeenCalled();
	});

	test("삭제 확인에서 삭제를 누르면 백신이 지워지고 onDone 이 불린다", () => {
		setVaccines([EXISTING, OTHER]);
		renderEdit(EXISTING);

		fireEvent.click(getButton("삭제"));
		const dialog = screen.getAllByRole("dialog")[1];
		fireEvent.click(within(dialog).getByRole("button", { name: "삭제" }));

		expect(getVaccines().map(({ id }) => id)).toEqual([OTHER.id]);
		expect(onDone).toHaveBeenCalledTimes(1);
	});
});
