import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import { validateForSave } from "@/data/rules";
import {
	ANTIGEN_ERROR_MESSAGES,
	type AntigenEditState,
	type AntigenError,
	addAntigen,
	canFinishAntigenEdit,
	changeAntigen,
	deleteAntigen,
	finishAntigenEdit,
	getAntigenEditing,
	getAntigenError,
	needsDeleteConfirm,
	startAntigenEdit,
	toggleAntigenPin,
	toggleExpandedVaccine,
} from "@/features/admin/antigenEditing";
import { addVaccine, type VaccineInfo } from "@/features/admin/vaccineList";
import type { Antigen, Vaccine, VaccineGameData } from "@/types/data";

/**
 * 목데이터 백신 5개의 항원 (괄호는 세부 타입, b 는 세균)
 * 5280 ABBNE: AI(Y280) ND IB EDS IBD / RV-K: RV CDV CPV(2b)
 * 가금 복합백신: ND(VII) IB(QX) AI(H9) EDS / Vaccine D: PED TGE(Purdue)
 * Vaccine E: PRRSV PCV(2d) MHP·b APP·b AD
 */
function filledVaccineGame(): VaccineGameData {
	return createMockData("filled")["vaccine-game"];
}

function emptyVaccineGame(): VaccineGameData {
	return createMockData("empty")["vaccine-game"];
}

/** 모양 검사(imagePathSchema)의 경로 형식 images/<kind>/<uuid>.png 를 지키는 테스트용 백신 정보 */
function vaccineInfo(name: string): VaccineInfo {
	return {
		brandName: { ko: "테스트", en: "Test" },
		productName: { ko: name, en: name },
		bottleImage: {
			ko: "images/vaccine-bottle/00000000-0000-4000-8000-000000000001.png",
			en: "images/vaccine-bottle/00000000-0000-4000-9000-000000000001.png",
		},
		logoImage: {
			ko: "images/vaccine-logo/00000000-0000-4000-8000-000000000001.png",
			en: "images/vaccine-logo/00000000-0000-4000-9000-000000000001.png",
		},
	};
}

function findVaccine(data: VaccineGameData, productName: string): Vaccine {
	const vaccine = data.vaccines.find((item) => item.productName.ko === productName);
	if (vaccine === undefined) throw new Error(`목데이터에 ${productName} 이 없습니다`);
	return vaccine;
}

function findAntigen(data: VaccineGameData, productName: string, abbr: string): Antigen {
	const antigen = findVaccine(data, productName).antigens.find((item) => item.abbr === abbr);
	if (antigen === undefined) throw new Error(`${productName} 에 ${abbr} 이 없습니다`);
	return antigen;
}

function idle(data = filledVaccineGame()): AntigenEditState {
	return { data, editing: null };
}

/** 목데이터의 항원 하나를 수정 중인 상태 */
function editingExisting(productName: string, abbr: string): AntigenEditState {
	const data = filledVaccineGame();
	return startAntigenEdit(
		idle(data),
		findVaccine(data, productName).id,
		findAntigen(data, productName, abbr).id,
	);
}

/** 목데이터의 항원 하나를 수정 시작해 값을 바꾼 상태 */
function changedExisting(
	state: AntigenEditState,
	productName: string,
	abbr: string,
	changes: Partial<Omit<Antigen, "id">>,
): AntigenEditState {
	const started = startAntigenEdit(
		state,
		findVaccine(state.data, productName).id,
		findAntigen(state.data, productName, abbr).id,
	);
	return changeAntigen(started, { ...editingAntigen(started), ...changes });
}

/** Vaccine D 의 항원 2개 중 TGE 만 고정한 상태 */
function pinnedTge(): AntigenEditState {
	const data = filledVaccineGame();
	findAntigen(data, "Vaccine D", "TGE").isPinned = true;
	return idle(data);
}

/** RV-K 에 항원을 추가하고 값을 넣은 상태 */
function addedToRvk(changes: Partial<Omit<Antigen, "id">> = {}): AntigenEditState {
	const state = idle();
	const added = addAntigen(state, findVaccine(state.data, "RV-K").id);
	const antigen = editingAntigen(added);
	return changeAntigen(added, { ...antigen, ...changes });
}

/** 오류마다 그 오류가 나는 수정 중 상태. 구분 다름(pathogenMismatch)만 완료를 막지 않습니다 */
const ERROR_CASES: [AntigenError, () => AntigenEditState][] = [
	["empty", () => addedToRvk()],
	["tooLong", () => addedToRvk({ abbr: "ABCDEFGHI" })],
	["duplicate", () => addedToRvk({ abbr: " CPV ", subtype: " 2b " })],
	["allPinned", () => changedExisting(pinnedTge(), "Vaccine D", "PED", { isPinned: true })],
	["pathogenMismatch", () => addedToRvk({ abbr: "MHP" })],
];

const BLOCKING_ERROR_CASES = ERROR_CASES.filter(([error]) => error !== "pathogenMismatch");

function editingAntigen(state: AntigenEditState): Antigen {
	const { editing } = state;
	if (editing === null) throw new Error("수정 중인 항원이 없습니다");
	return findAntigenById(state.data, editing.antigenId);
}

function findAntigenById(data: VaccineGameData, antigenId: string): Antigen {
	const antigen = data.vaccines
		.flatMap((vaccine) => vaccine.antigens)
		.find((item) => item.id === antigenId);
	if (antigen === undefined) throw new Error(`항원 ${antigenId} 이 없습니다`);
	return antigen;
}

function antigenErrorOf(state: AntigenEditState) {
	const { editing } = state;
	if (editing === null) throw new Error("수정 중인 항원이 없습니다");
	return getAntigenError(state.data, editing.vaccineId, editing.antigenId);
}

function abbrs(data: VaccineGameData, productName: string): string[] {
	return findVaccine(data, productName).antigens.map((antigen) => antigen.abbr);
}

function togglePin(state: AntigenEditState, productName: string, abbr: string) {
	return toggleAntigenPin(
		state,
		findVaccine(state.data, productName).id,
		findAntigen(state.data, productName, abbr).id,
	);
}

/** 고정을 누른 뒤 그 백신에서 고정된 항원의 약어. 거절되면 테스트를 실패시킵니다 */
function pinnedAfterToggle(state: AntigenEditState, productName: string, abbr: string): string[] {
	const result = togglePin(state, productName, abbr);
	if (!result.isSuccess) throw new Error(`${productName} 의 ${abbr} 고정이 거절됐습니다`);
	return findVaccine(result.data, productName)
		.antigens.filter((antigen) => antigen.isPinned)
		.map((antigen) => antigen.abbr);
}

function deepFreeze<T>(value: T): T {
	if (typeof value === "object" && value !== null) {
		for (const child of Object.values(value)) deepFreeze(child);
		Object.freeze(value);
	}
	return value;
}

describe("백신 행 펼치기", () => {
	test("접힌 행을 누르면 그 행을 펼친다", () => {
		expect(toggleExpandedVaccine(null, "a")).toBe("a");
	});

	test("다른 행을 누르면 앞 행은 접히고 누른 행만 펼친다", () => {
		expect(toggleExpandedVaccine("a", "b")).toBe("b");
	});

	test("펼친 행을 다시 누르면 접는다", () => {
		expect(toggleExpandedVaccine("a", "a")).toBeNull();
	});
});

describe("항원 추가", () => {
	test("빈 항원을 맨 아래에 넣고 그 행을 바로 수정 상태로 둔다", () => {
		const state = idle();
		const rvk = findVaccine(state.data, "RV-K");
		const added = addAntigen(state, rvk.id);
		const antigens = findVaccine(added.data, "RV-K").antigens;
		const last = antigens[antigens.length - 1];

		expect(antigens).toHaveLength(4);
		expect(last).toEqual({
			id: expect.any(String),
			abbr: "",
			subtype: null,
			pathogenType: "virus",
			isPinned: false,
		});
		expect(added.editing).toEqual({ vaccineId: rvk.id, antigenId: last.id, isNew: true });
	});

	test("항원이 이미 5개면 추가하지 않는다", () => {
		const state = idle();

		expect(addAntigen(state, findVaccine(state.data, "5280 ABBNE").id)).toBe(state);
	});

	test("다른 행을 수정하는 중에는 추가하지 않는다", () => {
		const state = editingExisting("RV-K", "CDV");

		expect(addAntigen(state, findVaccine(state.data, "Vaccine D").id)).toBe(state);
	});

	test("없는 백신에는 추가하지 않는다", () => {
		const state = idle();

		expect(addAntigen(state, "없는 백신")).toBe(state);
	});
});

describe("수정 시작과 입력", () => {
	test("수정을 누르면 그 행이 수정 상태가 된다", () => {
		const state = editingExisting("RV-K", "CDV");

		expect(state.editing).toEqual({
			vaccineId: findVaccine(state.data, "RV-K").id,
			antigenId: findAntigen(state.data, "RV-K", "CDV").id,
			isNew: false,
		});
	});

	test("다른 행을 수정하는 중에는 수정을 시작하지 않는다", () => {
		const state = editingExisting("RV-K", "CDV");
		const vaccine = findVaccine(state.data, "Vaccine D");

		expect(startAntigenEdit(state, vaccine.id, vaccine.antigens[0].id)).toBe(state);
	});

	test("입력은 수정 중인 행에만 바로 들어간다", () => {
		const state = editingExisting("RV-K", "CDV");
		const antigen = editingAntigen(state);
		const changed = changeAntigen(state, { ...antigen, abbr: "CAV", isPinned: true });

		expect(abbrs(changed.data, "RV-K")).toEqual(["RV", "CAV", "CPV"]);
		expect(editingAntigen(changed)).toEqual({ ...antigen, abbr: "CAV", isPinned: true });
		expect(changed.editing).toEqual(state.editing);
	});

	test("없는 항원이나 다른 백신의 항원이면 수정을 시작하지 않는다", () => {
		const state = idle();
		const cdv = findAntigen(state.data, "RV-K", "CDV");

		expect(startAntigenEdit(state, findVaccine(state.data, "RV-K").id, "없는 항원")).toBe(state);
		expect(startAntigenEdit(state, findVaccine(state.data, "Vaccine D").id, cdv.id)).toBe(state);
	});

	test("수정 중인 행이 없으면 입력을 무시한다", () => {
		const state = idle();
		const antigen = findAntigen(state.data, "RV-K", "CDV");

		expect(changeAntigen(state, { ...antigen, abbr: "CAV" })).toBe(state);
	});
});

describe("고정", () => {
	test("수정 중이 아니어도 바로 고정한다", () => {
		expect(pinnedAfterToggle(idle(), "Vaccine D", "PED")).toEqual(["PED"]);
	});

	test("고정한 항원을 누르면 고정을 푼다", () => {
		expect(pinnedAfterToggle(pinnedTge(), "Vaccine D", "TGE")).toEqual([]);
	});

	test("고정하지 않은 마지막 항원은 고정하지 않고 allPinned 로 거절한다", () => {
		expect(togglePin(pinnedTge(), "Vaccine D", "PED")).toEqual({
			isSuccess: false,
			reason: "allPinned",
		});
	});

	test("항원이 하나뿐인 백신은 그 항원을 고정하지 않는다", () => {
		const data = addVaccine(emptyVaccineGame(), vaccineInfo("Vaccine F"));
		const added = addAntigen(idle(data), data.vaccines[0].id);
		const finished = finishAntigenEdit(
			changeAntigen(added, { ...editingAntigen(added), abbr: "ND" }),
		);

		expect(togglePin(finished, "Vaccine F", "ND")).toEqual({
			isSuccess: false,
			reason: "allPinned",
		});
	});

	test("수정 중인 행도 같은 규칙으로 고정한다", () => {
		const state = pinnedTge();
		const pedEditing = startAntigenEdit(
			state,
			findVaccine(state.data, "Vaccine D").id,
			findAntigen(state.data, "Vaccine D", "PED").id,
		);

		expect(pinnedAfterToggle(editingExisting("Vaccine D", "PED"), "Vaccine D", "PED")).toEqual([
			"PED",
		]);
		expect(togglePin(pedEditing, "Vaccine D", "PED")).toEqual({
			isSuccess: false,
			reason: "allPinned",
		});
	});

	test("다른 행을 수정하는 중에는 고정을 바꾸지 않는다", () => {
		const state = editingExisting("RV-K", "CDV");

		expect(togglePin(state, "Vaccine D", "PED")).toEqual({ isSuccess: true, data: state.data });
	});

	test("없는 항원이나 다른 백신의 항원이면 고정을 바꾸지 않는다", () => {
		const state = idle();
		const cdv = findAntigen(state.data, "RV-K", "CDV");
		const unchanged = { isSuccess: true, data: state.data } as const;

		expect(toggleAntigenPin(state, findVaccine(state.data, "RV-K").id, "없는 항원")).toEqual(
			unchanged,
		);
		expect(toggleAntigenPin(state, findVaccine(state.data, "Vaccine D").id, cdv.id)).toEqual(
			unchanged,
		);
	});
});

describe("완료", () => {
	test("약어 오류가 없으면 수정 상태가 끝난다", () => {
		const finished = finishAntigenEdit(addedToRvk({ abbr: "AI", subtype: "H5" }));

		expect(finished.editing).toBeNull();
		expect(abbrs(finished.data, "RV-K")).toEqual(["RV", "CDV", "CPV", "AI"]);
	});

	test("완료하면 약어·세부 타입의 앞뒤 공백을 지우고, 빈 세부 타입은 없음(null)으로 둔다", () => {
		const trimmed = finishAntigenEdit(addedToRvk({ abbr: " AI ", subtype: " H5 " }));
		const blankSubtype = finishAntigenEdit(addedToRvk({ abbr: "AI", subtype: "   " }));

		expect(findVaccine(trimmed.data, "RV-K").antigens.at(-1)).toMatchObject({
			abbr: "AI",
			subtype: "H5",
		});
		expect(findVaccine(blankSubtype.data, "RV-K").antigens.at(-1)?.subtype).toBeNull();
	});

	test("공백만 바꾼 수정은 완료하면 원래 값과 같아진다", () => {
		const changed = changedExisting(idle(), "RV-K", "CPV", { abbr: "CPV ", subtype: " 2b" });

		expect(finishAntigenEdit(changed).data).toEqual(filledVaccineGame());
	});

	test.each(BLOCKING_ERROR_CASES)(
		"%s 오류면 완료되지 않고 수정 상태가 그대로다",
		(_, createState) => {
			const state = createState();

			expect(canFinishAntigenEdit(state)).toBe(false);
			expect(finishAntigenEdit(state)).toBe(state);
		},
	);

	test("세균·바이러스 구분만 다르면 문구는 남지만 완료할 수 있다", () => {
		const state = addedToRvk({ abbr: "MHP" });

		expect(antigenErrorOf(state)).toBe("pathogenMismatch");
		expect(canFinishAntigenEdit(state)).toBe(true);
		expect(finishAntigenEdit(state).editing).toBeNull();
	});
});

describe("항원 오류", () => {
	test.each(["", "   "])("약어가 비면(%p) empty", (abbr) => {
		expect(antigenErrorOf(addedToRvk({ abbr }))).toBe("empty");
	});

	test("약어는 대소문자를 구분해 비교한다 (노션 데이터구조: 입력한 그대로 비교)", () => {
		expect(antigenErrorOf(addedToRvk({ abbr: "cdv" }))).toBeNull();
		expect(antigenErrorOf(addedToRvk({ abbr: "mhp" }))).toBeNull();
	});

	test("약어가 8자를 넘으면 tooLong", () => {
		expect(antigenErrorOf(addedToRvk({ abbr: "ABCDEFGHI" }))).toBe("tooLong");
	});

	test("약어 길이는 앞뒤 공백을 뺀 값으로 센다", () => {
		expect(antigenErrorOf(addedToRvk({ abbr: "  ABCDEFGH  " }))).toBeNull();
	});

	test("수정 중인 행까지 고정해 백신의 항원이 모두 고정되면 allPinned", () => {
		const state = changedExisting(pinnedTge(), "Vaccine D", "PED", { isPinned: true });

		expect(antigenErrorOf(state)).toBe("allPinned");
	});

	test("고정하지 않은 항원이 하나라도 남으면 고정해도 된다", () => {
		const state = changedExisting(idle(), "Vaccine D", "PED", { isPinned: true });

		expect(antigenErrorOf(state)).toBeNull();
	});

	test("같은 백신에 약어와 세부 타입이 같은 항원이 있으면 duplicate", () => {
		expect(antigenErrorOf(addedToRvk({ abbr: "CDV" }))).toBe("duplicate");
	});

	test("앞뒤 공백과 빈 세부 타입은 정리한 값으로 비교한다", () => {
		expect(antigenErrorOf(addedToRvk({ abbr: " CPV ", subtype: " 2b " }))).toBe("duplicate");
		expect(antigenErrorOf(addedToRvk({ abbr: "CDV", subtype: "  " }))).toBe("duplicate");
	});

	test("세부 타입이 다르면 같은 약어라도 중복이 아니다", () => {
		expect(antigenErrorOf(addedToRvk({ abbr: "CPV" }))).toBeNull();
	});

	test("수정 중인 행 자신과는 비교하지 않는다", () => {
		expect(antigenErrorOf(editingExisting("RV-K", "CDV"))).toBeNull();
	});

	test("다른 백신의 같은 약어와 세균·바이러스 구분이 다르면 pathogenMismatch", () => {
		expect(antigenErrorOf(addedToRvk({ abbr: "MHP" }))).toBe("pathogenMismatch");
		expect(antigenErrorOf(addedToRvk({ abbr: "AI", pathogenType: "bacteria" }))).toBe(
			"pathogenMismatch",
		);
	});

	test("같은 백신 안에서도 세부 타입만 다른 같은 약어는 구분이 같아야 한다", () => {
		const state = addedToRvk({ abbr: "CPV", subtype: "2c", pathogenType: "bacteria" });

		expect(antigenErrorOf(state)).toBe("pathogenMismatch");
	});

	test("구분이 같으면 다른 백신에 같은 약어가 있어도 된다", () => {
		expect(antigenErrorOf(addedToRvk({ abbr: "AI", subtype: "Y280" }))).toBeNull();
		expect(antigenErrorOf(addedToRvk({ abbr: "APP", pathogenType: "bacteria" }))).toBeNull();
	});

	test("없는 항원은 오류가 없다", () => {
		const data = filledVaccineGame();

		expect(getAntigenError(data, findVaccine(data, "RV-K").id, "없는 항원")).toBeNull();
	});
});

describe("삭제", () => {
	test("새로 추가한 행은 확인 없이 지워 추가를 취소한다", () => {
		const state = addedToRvk({ abbr: "AI" });
		const { editing } = state;
		if (editing === null) throw new Error("수정 중인 항원이 없습니다");
		const deleted = deleteAntigen(state, editing.vaccineId, editing.antigenId);

		expect(needsDeleteConfirm(editing, editing.antigenId)).toBe(false);
		expect(deleted).toEqual(idle());
	});

	test("기존 행은 수정 중이어도 확인을 거친다", () => {
		const { data, editing } = editingExisting("RV-K", "CDV");

		expect(needsDeleteConfirm(editing, findAntigen(data, "RV-K", "CDV").id)).toBe(true);
		expect(needsDeleteConfirm(null, findAntigen(data, "RV-K", "RV").id)).toBe(true);
	});

	test("수정 중인 행을 지우면 수정 상태도 끝난다", () => {
		const state = editingExisting("RV-K", "CDV");
		const vaccine = findVaccine(state.data, "RV-K");
		const deleted = deleteAntigen(state, vaccine.id, findAntigen(state.data, "RV-K", "CDV").id);

		expect(abbrs(deleted.data, "RV-K")).toEqual(["RV", "CPV"]);
		expect(deleted.editing).toBeNull();
	});

	test("수정 중이 아니면 어느 행이든 지울 수 있다", () => {
		const state = idle();
		const vaccine = findVaccine(state.data, "RV-K");
		const deleted = deleteAntigen(state, vaccine.id, findAntigen(state.data, "RV-K", "RV").id);

		expect(abbrs(deleted.data, "RV-K")).toEqual(["CDV", "CPV"]);
	});

	test("다른 행을 수정하는 중에는 지우지 않는다", () => {
		const state = editingExisting("RV-K", "CDV");
		const vaccine = findVaccine(state.data, "RV-K");

		expect(deleteAntigen(state, vaccine.id, findAntigen(state.data, "RV-K", "RV").id)).toBe(state);
	});

	test("수정 중인 행이라도 다른 백신 id 로 부르면 지우지도, 수정 상태를 풀지도 않는다", () => {
		const state = addedToRvk();
		const { editing } = state;
		if (editing === null) throw new Error("수정 중인 항원이 없습니다");
		const otherVaccine = findVaccine(state.data, "Vaccine D");

		expect(deleteAntigen(state, otherVaccine.id, editing.antigenId)).toBe(state);
	});

	test("없는 항원이면 아무것도 바꾸지 않는다", () => {
		const state = idle();

		expect(deleteAntigen(state, findVaccine(state.data, "RV-K").id, "없는 항원")).toBe(state);
	});

	test("마지막 1개도 지울 수 있고, 0개면 저장 규칙이 막는다", () => {
		let state = idle();
		const vaccine = findVaccine(state.data, "Vaccine D");
		for (const antigen of vaccine.antigens) {
			state = deleteAntigen(state, vaccine.id, antigen.id);
		}

		expect(abbrs(state.data, "Vaccine D")).toEqual([]);
		expect(validateForSave("vaccine-game", state.data)).toEqual({
			isValid: false,
			issues: [expect.stringContaining("항원은")],
		});
	});
});

describe("초안에 없는 수정 상태", () => {
	test("수정 중인 항원이 초안에 없으면(변경 취소 등) 수정 중이 아닌 것으로 본다", () => {
		const added = addedToRvk({ abbr: "AI" });

		expect(getAntigenEditing(added.data, added.editing)).toEqual(added.editing);
		expect(getAntigenEditing(filledVaccineGame(), added.editing)).toBeNull();
	});

	test("그 상태에서는 다른 행의 수정·추가·삭제를 막지 않는다", () => {
		const { editing } = addedToRvk({ abbr: "AI" });
		const reverted = { data: filledVaccineGame(), editing };
		const vaccine = findVaccine(reverted.data, "RV-K");
		const cdv = findAntigen(reverted.data, "RV-K", "CDV");

		expect(startAntigenEdit(reverted, vaccine.id, cdv.id).editing?.antigenId).toBe(cdv.id);
		expect(addAntigen(reverted, vaccine.id).editing?.isNew).toBe(true);
		expect(abbrs(deleteAntigen(reverted, vaccine.id, cdv.id).data, "RV-K")).toEqual(["RV", "CPV"]);
	});

	test("그 상태의 입력은 무시하고, 완료하면 수정 상태를 비운다", () => {
		const { editing } = addedToRvk({ abbr: "AI" });
		const reverted = { data: filledVaccineGame(), editing };
		const cdv = findAntigen(reverted.data, "RV-K", "CDV");

		expect(changeAntigen(reverted, { ...cdv, abbr: "CAV" })).toBe(reverted);
		expect(finishAntigenEdit(reverted)).toEqual({ data: reverted.data, editing: null });
	});
});

describe("받은 값", () => {
	test("받은 값을 바꾸지 않고 새 값을 돌려준다", () => {
		const data = deepFreeze(filledVaccineGame());
		const vaccine = findVaccine(data, "RV-K");
		const cdv = findAntigen(data, "RV-K", "CDV");

		expect(() => {
			const added = addAntigen(idle(data), vaccine.id);
			finishAntigenEdit(changeAntigen(added, { ...editingAntigen(added), abbr: "AI" }));
			const editing = startAntigenEdit(idle(data), vaccine.id, cdv.id);
			changeAntigen(editing, { ...cdv, abbr: "CAV" });
			deleteAntigen(editing, vaccine.id, cdv.id);
			toggleAntigenPin(idle(data), vaccine.id, cdv.id);
		}).not.toThrow();
		expect(data).toEqual(filledVaccineGame());
	});
});

describe("저장 규칙과 함께", () => {
	test("항원 추가 → 약어 입력 → 완료로 만든 값은 저장할 수 있다", () => {
		const finished = finishAntigenEdit(addedToRvk({ abbr: "AI", subtype: "H5" }));

		expect(validateForSave("vaccine-game", finished.data)).toMatchObject({ isValid: true });
	});

	test("바로 고정한 값은 저장할 수 있다", () => {
		const result = togglePin(idle(), "Vaccine D", "PED");
		if (!result.isSuccess) throw new Error("고정이 거절됐습니다");

		expect(validateForSave("vaccine-game", result.data)).toMatchObject({ isValid: true });
	});

	test("첫 실행에서 백신을 넣고 항원을 추가해 완료하면 저장할 수 있다", () => {
		const data = addVaccine(emptyVaccineGame(), vaccineInfo("Vaccine F"));
		const added = addAntigen(idle(data), data.vaccines[0].id);
		const finished = finishAntigenEdit(
			changeAntigen(added, { ...editingAntigen(added), abbr: "ND" }),
		);

		expect(validateForSave("vaccine-game", finished.data)).toMatchObject({ isValid: true });
	});

	test.each(ERROR_CASES)(
		"행 문구(%s)는 저장 규칙이 막을 때의 문구와 같다",
		(error, createState) => {
			const state = createState();

			expect(antigenErrorOf(state)).toBe(error);
			expect(validateForSave("vaccine-game", state.data)).toEqual({
				isValid: false,
				issues: [expect.stringContaining(ANTIGEN_ERROR_MESSAGES[error])],
			});
		},
	);

	test("여러 백신에 있는 약어도 한 행씩 세균으로 바꿔 저장할 수 있다", () => {
		const first = finishAntigenEdit(
			changedExisting(idle(), "5280 ABBNE", "AI", { pathogenType: "bacteria" }),
		);

		expect(first.editing).toBeNull();
		expect(validateForSave("vaccine-game", first.data)).toEqual({
			isValid: false,
			issues: [expect.stringContaining(ANTIGEN_ERROR_MESSAGES.pathogenMismatch)],
		});

		const second = finishAntigenEdit(
			changedExisting(first, "가금 복합백신", "AI", { pathogenType: "bacteria" }),
		);

		expect(validateForSave("vaccine-game", second.data)).toMatchObject({ isValid: true });
	});
});
