import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LIMITS } from "@/data/schema";
import * as storage from "@/data/storage";
import { ANTIGEN_ERROR_MESSAGES, ANTIGEN_PIN_NOTICE } from "@/features/admin/antigenEditing";
import { VACCINE_LIMIT_NOTICE } from "@/features/admin/vaccineList";
import type { Antigen, Vaccine } from "@/types/data";

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getImageUrl: (path: string) => `file://${path}`,
}));

const { useSettingsDraft } = await import("@/features/admin/settingsDraft");
const { default: VaccineListSection } = await import("@/pages/admin/VaccineListSection");

const MAX_ENABLED = LIMITS.enabledVaccines.max;

function createAntigen(id: string, abbr: string, overrides: Partial<Antigen> = {}): Antigen {
	return { id, abbr, subtype: null, pathogenType: "virus", isPinned: false, ...overrides };
}

function createVaccine(id: string, productName: string, overrides: Partial<Vaccine> = {}): Vaccine {
	return {
		id,
		brandName: { ko: "브랜드", en: "Brand" },
		productName: { ko: productName, en: id },
		bottleImage: { ko: `${id}-bottle-ko.png`, en: `${id}-bottle-en.png` },
		logoImage: { ko: `${id}-logo-ko.png`, en: `${id}-logo-en.png` },
		isEnabled: true,
		antigens: [],
		...overrides,
	};
}

const CIRCO = createVaccine("circo", "써코백", {
	antigens: [
		createAntigen("pcv2", "PCV2", { isPinned: true }),
		createAntigen("myco", "M.hyo", { pathogenType: "bacteria" }),
	],
});
const FLU = createVaccine("flu", "플루백", {
	isEnabled: false,
	antigens: [createAntigen("h9n2", "H9N2")],
});

function setVaccines(vaccines: Vaccine[]) {
	const { draft } = useSettingsDraft.getState();
	const data = { ...draft, "vaccine-game": { ...draft["vaccine-game"], vaccines } };
	useSettingsDraft.setState({ original: data, draft: data, antigenEditing: null });
}

function getVaccines() {
	return useSettingsDraft.getState().draft["vaccine-game"].vaccines;
}

function getVaccine(vaccineId: string) {
	const vaccine = getVaccines().find((item) => item.id === vaccineId);
	if (vaccine === undefined) throw new Error(`초안에 ${vaccineId} 백신이 없습니다`);
	return vaccine;
}

function toWithin(element: Element | null | undefined, name: string) {
	if (!(element instanceof HTMLElement)) throw new Error(`${name} 을(를) 찾을 수 없습니다`);
	return within(element);
}

/** 사용 체크, 이름, 항원 펼치기, 수정, 삭제가 있는 백신 행의 윗줄 */
function getVaccineHeader(productName: string) {
	const checkbox = screen.getByRole("checkbox", { name: `${productName} 사용` });
	return toWithin(checkbox.closest("div"), `${productName} 백신 행`);
}

/** 고정, 약어, ⓘ, 세균 체크, 수정(완료), 삭제가 있는 항원 행 */
function getAntigenRow(antigenName: string) {
	const pinButton = screen.getByRole("button", { name: `${antigenName} 고정` });
	return toWithin(pinButton.parentElement, `${antigenName} 항원 행`);
}

function getButton(name: string) {
	return screen.getByRole<HTMLButtonElement>("button", { name });
}

function getDialog() {
	return within(screen.getByRole("dialog"));
}

function renderSection() {
	render(<VaccineListSection />);
}

function expandCirco() {
	fireEvent.click(getButton("항원 2개"));
}

function addAntigenToCirco() {
	expandCirco();
	fireEvent.click(getButton("+ 항원 추가"));
}

function typeAbbr(antigenName: string, abbr: string) {
	const input = getAntigenRow(antigenName).getByRole("textbox", { name: "약어" });
	fireEvent.change(input, { target: { value: abbr } });
}

beforeEach(() => {
	setVaccines([CIRCO, FLU]);
});

afterEach(cleanup);

describe("백신 목록", () => {
	test("등록된 백신이 없으면 빈 목록 안내를 보여 준다", () => {
		setVaccines([]);
		renderSection();

		expect(screen.getByText("등록된 백신이 없습니다")).toBeTruthy();
	});

	test("검색하면 제품명이 맞는 백신만 남고, 없으면 검색어와 함께 안내한다", () => {
		renderSection();
		const search = screen.getByRole("textbox", { name: "백신 검색" });

		fireEvent.change(search, { target: { value: "플루" } });
		expect(screen.getByRole("checkbox", { name: "플루백 사용" })).toBeTruthy();
		expect(screen.queryByRole("checkbox", { name: "써코백 사용" })).toBeNull();

		fireEvent.change(search, { target: { value: "없는 백신" } });
		expect(screen.getByText("검색 결과가 없습니다")).toBeTruthy();
		expect(screen.getByText("'없는 백신'에 맞는 백신이 없습니다.")).toBeTruthy();
	});
});

describe("백신 사용 체크", () => {
	test("체크를 바꾸면 초안에 반영되고 사용 수가 바뀐다", () => {
		renderSection();
		expect(screen.getByText(`사용 1 / ${MAX_ENABLED}`)).toBeTruthy();

		fireEvent.click(screen.getByRole("checkbox", { name: "플루백 사용" }));
		expect(getVaccine("flu").isEnabled).toBe(true);
		expect(screen.getByText(`사용 2 / ${MAX_ENABLED}`)).toBeTruthy();

		fireEvent.click(screen.getByRole("checkbox", { name: "써코백 사용" }));
		expect(getVaccine("circo").isEnabled).toBe(false);
		expect(screen.getByText(`사용 1 / ${MAX_ENABLED}`)).toBeTruthy();
	});

	test("사용 백신이 최대면 더 켜지 않고 한도 안내를 보여 준다", () => {
		const enabled = Array.from({ length: MAX_ENABLED }, (_, index) =>
			createVaccine(`on-${index}`, `켠 백신 ${index}`),
		);
		setVaccines([...enabled, createVaccine("off", "끈 백신", { isEnabled: false })]);
		renderSection();

		const checkbox = screen.getByRole<HTMLInputElement>("checkbox", { name: "끈 백신 사용" });
		fireEvent.click(checkbox);

		expect(getVaccine("off").isEnabled).toBe(false);
		expect(checkbox.checked).toBe(false);
		expect(screen.getByRole("status").textContent).toBe(VACCINE_LIMIT_NOTICE.message);
	});
});

describe("항원 편집", () => {
	test("'항원 N개'를 누르면 그 백신의 항원 행을 펼치고, 다시 누르면 접는다", () => {
		renderSection();
		const toggle = getButton("항원 2개");

		fireEvent.click(toggle);
		expect(toggle.getAttribute("aria-expanded")).toBe("true");
		expect(getButton("PCV2 고정")).toBeTruthy();
		expect(getButton("M.hyo 고정")).toBeTruthy();
		expect(screen.queryByRole("button", { name: "H9N2 고정" })).toBeNull();

		fireEvent.click(toggle);
		expect(toggle.getAttribute("aria-expanded")).toBe("false");
		expect(screen.queryByRole("button", { name: "PCV2 고정" })).toBeNull();
	});

	test("'+ 항원 추가'를 누르면 새 행이 수정 중으로 열리고, 오류 문구 없이 완료만 막힌다", () => {
		renderSection();
		addAntigenToCirco();

		const row = getAntigenRow("새 항원");
		expect(row.getByRole<HTMLInputElement>("textbox", { name: "약어" }).value).toBe("");
		expect(row.getByRole<HTMLButtonElement>("button", { name: "완료" }).disabled).toBe(true);
		expect(screen.queryByText(ANTIGEN_ERROR_MESSAGES.empty)).toBeNull();
		expect(getVaccine("circo").antigens).toHaveLength(3);
	});

	test("약어·세부 타입·세균을 고치고 완료하면 앞뒤 공백을 뺀 값이 초안에 남고 수정이 끝난다", () => {
		renderSection();
		addAntigenToCirco();

		typeAbbr("새 항원", " APP ");
		const subtype = getAntigenRow("APP").getByRole("textbox", { name: "세부 타입" });
		fireEvent.change(subtype, { target: { value: " 2 " } });
		fireEvent.click(screen.getByRole("checkbox", { name: "APP 2 세균" }));
		fireEvent.click(getAntigenRow("APP 2").getByRole("button", { name: "완료" }));

		expect(getVaccine("circo").antigens.at(-1)).toMatchObject({
			abbr: "APP",
			subtype: "2",
			pathogenType: "bacteria",
		});
		expect(screen.queryByRole("textbox", { name: "약어" })).toBeNull();
		expect(useSettingsDraft.getState().antigenEditing).toBeNull();
	});

	test("세부 타입을 모두 지우면 빈 글자가 아니라 null 로 남는다", () => {
		renderSection();
		addAntigenToCirco();
		typeAbbr("새 항원", "APP");
		const subtype = getAntigenRow("APP").getByRole("textbox", { name: "세부 타입" });

		fireEvent.change(subtype, { target: { value: "2" } });
		fireEvent.change(subtype, { target: { value: "" } });

		expect(getVaccine("circo").antigens.at(-1)?.subtype).toBeNull();
	});

	test("있던 항원의 약어를 지우면 오류 문구를 보여 주고 완료를 막는다", () => {
		renderSection();
		expandCirco();
		fireEvent.click(getAntigenRow("PCV2").getByRole("button", { name: "수정" }));

		typeAbbr("PCV2", "");

		const row = getAntigenRow("새 항원");
		const input = row.getByRole("textbox", { name: "약어" });
		const messageId = input.getAttribute("aria-describedby") ?? "";
		expect(input.getAttribute("aria-invalid")).toBe("true");
		expect(document.getElementById(messageId)?.textContent).toBe(ANTIGEN_ERROR_MESSAGES.empty);
		expect(row.getByRole<HTMLButtonElement>("button", { name: "완료" }).disabled).toBe(true);
	});

	test("수정 중에는 검색, 새 백신 추가, 백신 행, 다른 항원 행을 막는다", () => {
		renderSection();
		expandCirco();
		fireEvent.click(getAntigenRow("PCV2").getByRole("button", { name: "수정" }));

		const search = screen.getByRole<HTMLInputElement>("textbox", { name: "백신 검색" });
		expect(search.disabled).toBe(true);
		expect(getButton("+ 새 백신 추가").disabled).toBe(true);
		expect(getButton("+ 항원 추가").disabled).toBe(true);

		const vaccineHeader = getVaccineHeader("써코백");
		expect(vaccineHeader.getByRole<HTMLInputElement>("checkbox").disabled).toBe(true);
		for (const name of ["항원 2개", "수정", "삭제"]) {
			expect(vaccineHeader.getByRole<HTMLButtonElement>("button", { name }).disabled).toBe(true);
		}

		const otherRow = getAntigenRow("M.hyo");
		for (const name of ["M.hyo 고정", "수정", "삭제"]) {
			expect(otherRow.getByRole<HTMLButtonElement>("button", { name }).disabled).toBe(true);
		}
		expect(otherRow.getByRole<HTMLInputElement>("checkbox", { name: "M.hyo 세균" }).disabled).toBe(
			true,
		);

		const editingRow = getAntigenRow("PCV2");
		for (const name of ["PCV2 고정", "완료", "삭제"]) {
			expect(editingRow.getByRole<HTMLButtonElement>("button", { name }).disabled).toBe(false);
		}
		expect(editingRow.getByRole<HTMLInputElement>("checkbox", { name: "PCV2 세균" }).disabled).toBe(
			false,
		);
	});
});

describe("항원 고정", () => {
	test("고정을 누르면 초안의 고정이 바뀐다", () => {
		renderSection();
		expandCirco();

		fireEvent.click(getButton("PCV2 고정"));

		expect(getVaccine("circo").antigens[0].isPinned).toBe(false);
		expect(getButton("PCV2 고정").getAttribute("aria-pressed")).toBe("false");
	});

	test("모든 항원이 고정되는 고정은 거절하고 안내를 보여 준다", () => {
		renderSection();
		expandCirco();

		fireEvent.click(getButton("M.hyo 고정"));

		expect(getVaccine("circo").antigens[1].isPinned).toBe(false);
		expect(screen.getByRole("status").textContent).toBe(ANTIGEN_PIN_NOTICE.message);
	});
});

describe("항원 삭제", () => {
	test("방금 추가한 행은 확인 없이 바로 지운다", () => {
		renderSection();
		addAntigenToCirco();

		fireEvent.click(getAntigenRow("새 항원").getByRole("button", { name: "삭제" }));

		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getVaccine("circo").antigens.map(({ id }) => id)).toEqual(["pcv2", "myco"]);
		expect(useSettingsDraft.getState().antigenEditing).toBeNull();
	});

	test("있던 항원은 확인 창에서 삭제를 눌러야 지우고, 취소하면 그대로 둔다", () => {
		renderSection();
		expandCirco();
		const deleteButton = getAntigenRow("M.hyo").getByRole("button", { name: "삭제" });

		fireEvent.click(deleteButton);
		expect(getDialog().getByText("M.hyo")).toBeTruthy();
		fireEvent.click(getDialog().getByRole("button", { name: "취소" }));
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getVaccine("circo").antigens).toHaveLength(2);

		fireEvent.click(deleteButton);
		fireEvent.click(getDialog().getByRole("button", { name: "삭제" }));
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getVaccine("circo").antigens.map(({ id }) => id)).toEqual(["pcv2"]);
	});
});

describe("백신 삭제", () => {
	test("확인 창에서 삭제를 눌러야 목록에서 빼고, 취소하면 그대로 둔다", () => {
		renderSection();
		const deleteButton = getVaccineHeader("써코백").getByRole("button", { name: "삭제" });

		fireEvent.click(deleteButton);
		expect(getDialog().getByText("써코백")).toBeTruthy();
		fireEvent.click(getDialog().getByRole("button", { name: "취소" }));
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getVaccines()).toHaveLength(2);

		fireEvent.click(deleteButton);
		fireEvent.click(getDialog().getByRole("button", { name: "삭제" }));
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(getVaccines().map(({ id }) => id)).toEqual(["flu"]);
		expect(screen.queryByRole("checkbox", { name: "써코백 사용" })).toBeNull();
	});
});
