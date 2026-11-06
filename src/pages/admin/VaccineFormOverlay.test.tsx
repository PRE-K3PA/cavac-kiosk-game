import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import * as storage from "@/data/storage";
import { IMAGE_ERROR_MESSAGES } from "@/features/admin/imageUpload";
import type { ImageKind, ImageResult, Vaccine } from "@/types/data";

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
const postImage = mock<(kind: ImageKind) => Promise<ImageResult>>();
mock.module("@/data/storage", () => ({
	...storage,
	getImageUrl: (path: string) => `file://${path}`,
	postImage,
}));

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

const EXISTING = createVaccine("circo", {
	brandName: { ko: "써코컴", en: "CircoComb" },
	productName: { ko: "써코백", en: "Circovac" },
});
const OTHER = createVaccine("flu", { productName: { ko: "플루백", en: "Fluvac" } });

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

/** 백신 이미지(KR·EN), 백신 로고(KR·EN) 순서로 그려지는 "파일 선택" 버튼 */
function getImageSelectButtons() {
	return screen.getAllByRole("button", { name: "파일 선택" });
}

function fillName(name: { ko: string; en: string }, field: "브랜드명" | "제품명") {
	fireEvent.change(screen.getByRole("textbox", { name: `KR ${field}` }), {
		target: { value: name.ko },
	});
	fireEvent.change(screen.getByRole("textbox", { name: `EN ${field}` }), {
		target: { value: name.en },
	});
}

function fillValidName() {
	fillName({ ko: "포울샷", en: "Fowlshot" }, "브랜드명");
	fillName({ ko: "5280 ABBNE", en: "5280 ABBNE" }, "제품명");
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

		postImage.mockResolvedValue({ status: "ok", path: "picked.png" });
		for (const button of getImageSelectButtons()) {
			fireEvent.click(button);
			await waitFor(() => expect(getButton("확인").disabled).not.toBeUndefined());
		}

		await waitFor(() => expect(getButton("확인").disabled).toBe(false));
	});

	test("사진 고르기를 취소하면 그 칸은 비어 있고 확인은 막힌 채로 남는다", async () => {
		renderAdd();
		fillValidName();
		postImage.mockResolvedValue({ status: "cancel" });

		fireEvent.click(getImageSelectButtons()[0]);

		await waitFor(() => expect(postImage).toHaveBeenCalledTimes(1));
		expect(screen.queryByRole("button", { name: "미리보기" })).toBeNull();
		expect(getButton("확인").disabled).toBe(true);
	});

	test("사진 고르기가 실패하면 그 칸에만 오류 문구를 보여 준다", async () => {
		renderAdd();
		fillValidName();
		postImage.mockResolvedValue({ status: "error", reason: "size" });

		fireEvent.click(getImageSelectButtons()[0]);

		await screen.findByText(IMAGE_ERROR_MESSAGES.size);
		expect(getButton("확인").disabled).toBe(true);
	});

	test("확인을 누르면 초안 끝에 새 백신이 들어가고 onAdded 가 새 id 를 받는다", async () => {
		setVaccines([OTHER]);
		renderAdd();
		fillValidName();

		postImage
			.mockResolvedValueOnce({ status: "ok", path: "bottle-ko.png" })
			.mockResolvedValueOnce({ status: "ok", path: "bottle-en.png" })
			.mockResolvedValueOnce({ status: "ok", path: "logo-ko.png" })
			.mockResolvedValueOnce({ status: "ok", path: "logo-en.png" });

		const [bottleKo, bottleEn, logoKo, logoEn] = getImageSelectButtons();
		fireEvent.click(bottleKo);
		await waitFor(() =>
			expect(screen.getAllByRole("button", { name: "미리보기" })).toHaveLength(1),
		);
		fireEvent.click(bottleEn);
		await waitFor(() =>
			expect(screen.getAllByRole("button", { name: "미리보기" })).toHaveLength(2),
		);
		fireEvent.click(logoKo);
		await waitFor(() =>
			expect(screen.getAllByRole("button", { name: "미리보기" })).toHaveLength(3),
		);
		fireEvent.click(logoEn);
		await waitFor(() =>
			expect(screen.getAllByRole("button", { name: "미리보기" })).toHaveLength(4),
		);

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

	test("이름을 고치고 확인하면 그 백신만 갱신되고 onDone 이 불린다", () => {
		setVaccines([EXISTING, OTHER]);
		renderEdit(EXISTING);

		fireEvent.change(screen.getByRole("textbox", { name: "KR 브랜드명" }), {
			target: { value: "새이름" },
		});
		fireEvent.click(getButton("확인"));

		expect(getVaccine(EXISTING.id).brandName.ko).toBe("새이름");
		expect(getVaccine(OTHER.id)).toEqual(OTHER);
		expect(onDone).toHaveBeenCalledTimes(1);
		expect(onAdded).not.toHaveBeenCalled();
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
