import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import { validateForSave } from "@/data/rules";
import {
	addVaccine,
	countEnabledVaccines,
	deleteVaccine,
	disableVaccine,
	enableVaccine,
	filterVaccines,
	getVaccineUsageNotice,
	updateVaccineInfo,
	VACCINE_LIMIT_NOTICE,
	type VaccineInfo,
} from "@/features/admin/vaccineList";
import type { Vaccine, VaccineGameData } from "@/types/data";

/** 모양 검사(imagePathSchema)의 경로 형식 images/<kind>/<uuid>.png 를 지키는 테스트용 백신 정보 */
function vaccineInfo(name: string, id = 1): VaccineInfo {
	const suffix = String(id).padStart(12, "0");
	return {
		brandName: { ko: "테스트", en: "Test" },
		productName: { ko: name, en: name },
		bottleImage: {
			ko: `images/vaccine-bottle/00000000-0000-4000-8000-${suffix}.png`,
			en: `images/vaccine-bottle/00000000-0000-4000-9000-${suffix}.png`,
		},
		logoImage: {
			ko: `images/vaccine-logo/00000000-0000-4000-8000-${suffix}.png`,
			en: `images/vaccine-logo/00000000-0000-4000-9000-${suffix}.png`,
		},
	};
}

/** 백신 5개(5280 ABBNE, RV-K, 가금 복합백신 켜짐 / Vaccine D, Vaccine E 꺼짐) */
function filledVaccineGame(): VaccineGameData {
	return createMockData("filled")["vaccine-game"];
}

function emptyVaccineGame(): VaccineGameData {
	return createMockData("empty")["vaccine-game"];
}

function vaccineId(data: VaccineGameData, productName: string): string {
	const vaccine = data.vaccines.find((item) => item.productName.ko === productName);
	if (vaccine === undefined) throw new Error(`목데이터에 ${productName} 이 없습니다`);
	return vaccine.id;
}

function productNames(vaccines: Vaccine[]): string[] {
	return vaccines.map((vaccine) => vaccine.productName.ko);
}

function enabledNames(data: VaccineGameData): string[] {
	return productNames(data.vaccines.filter((vaccine) => vaccine.isEnabled));
}

function deepFreeze<T>(value: T): T {
	if (typeof value === "object" && value !== null) {
		for (const child of Object.values(value)) deepFreeze(child);
		Object.freeze(value);
	}
	return value;
}

describe("검색", () => {
	test("제품명 KR 로 찾는다", () => {
		expect(productNames(filterVaccines(filledVaccineGame().vaccines, "복합"))).toEqual([
			"가금 복합백신",
		]);
	});

	test("제품명 EN 으로 찾고, 영문 대소문자는 무시한다", () => {
		expect(productNames(filterVaccines(filledVaccineGame().vaccines, "POULTRY"))).toEqual([
			"가금 복합백신",
		]);
	});

	test("검색어의 앞뒤 공백은 무시한다", () => {
		expect(productNames(filterVaccines(filledVaccineGame().vaccines, "  rv-k "))).toEqual(["RV-K"]);
	});

	test("브랜드명으로는 찾지 않는다", () => {
		expect(filterVaccines(filledVaccineGame().vaccines, "포울샷")).toEqual([]);
	});

	test("여러 개가 맞으면 목록 순서대로 남긴다", () => {
		expect(productNames(filterVaccines(filledVaccineGame().vaccines, "vaccine"))).toEqual([
			"Vaccine D",
			"Vaccine E 긴 제품명 줄바꿈 확인",
		]);
	});

	test.each(["", "   "])("검색어가 비면(%p) 전부 보여 준다", (query) => {
		const { vaccines } = filledVaccineGame();

		expect(filterVaccines(vaccines, query)).toEqual(vaccines);
	});

	test("맞는 백신이 없으면 빈 목록이다", () => {
		expect(filterVaccines(filledVaccineGame().vaccines, "광견병")).toEqual([]);
	});
});

describe("사용 켜기·끄기", () => {
	test("꺼진 백신을 켠다", () => {
		const data = filledVaccineGame();
		const result = enableVaccine(data, vaccineId(data, "Vaccine D"));

		expect(result.isSuccess).toBe(true);
		if (!result.isSuccess) return;
		expect(enabledNames(result.data)).toEqual(["5280 ABBNE", "RV-K", "가금 복합백신", "Vaccine D"]);
	});

	test("이미 켜진 백신은 그대로 둔다", () => {
		const data = filledVaccineGame();

		expect(enableVaccine(data, vaccineId(data, "RV-K"))).toEqual({ isSuccess: true, data });
	});

	test("없는 백신이면 아무것도 바꾸지 않는다", () => {
		const data = filledVaccineGame();

		expect(enableVaccine(data, "없는 백신")).toEqual({ isSuccess: true, data });
	});

	test("4개가 켜져 있으면 5번째까지 켤 수 있다", () => {
		const data = filledVaccineGame();
		const fourth = enableVaccine(data, vaccineId(data, "Vaccine D"));
		if (!fourth.isSuccess) throw new Error("4번째 백신을 켜지 못했습니다");
		const fifth = enableVaccine(fourth.data, vaccineId(data, "Vaccine E 긴 제품명 줄바꿈 확인"));

		expect(fifth.isSuccess).toBe(true);
		if (!fifth.isSuccess) return;
		expect(countEnabledVaccines(fifth.data.vaccines)).toBe(5);
	});

	test("5개가 켜져 있으면 6번째는 켜지 않고 이유를 돌려준다", () => {
		let data = filledVaccineGame();
		for (const vaccine of data.vaccines) vaccine.isEnabled = true;
		data = addVaccine(data, vaccineInfo("Vaccine F"));

		expect(enableVaccine(data, vaccineId(data, "Vaccine F"))).toEqual({
			isSuccess: false,
			reason: "limit",
		});
	});

	test("사용을 끄면 그 백신만 꺼진다", () => {
		const data = filledVaccineGame();

		expect(enabledNames(disableVaccine(data, vaccineId(data, "RV-K")))).toEqual([
			"5280 ABBNE",
			"가금 복합백신",
		]);
	});

	test("사용 백신 수는 켜진 백신만 센다", () => {
		expect(countEnabledVaccines(filledVaccineGame().vaccines)).toBe(3);
	});
});

describe("사용 안내", () => {
	const usageMessage = "백신을 1개 이상 체크해야 저장할 수 있어요.";

	test("켠 백신이 1개 이상이면 안내하지 않는다", () => {
		expect(getVaccineUsageNotice(filledVaccineGame().vaccines)).toBeNull();
	});

	test("등록된 백신이 없으면 앰버로 체크를 알린다 (빈 상태)", () => {
		expect(getVaccineUsageNotice(emptyVaccineGame().vaccines)).toEqual({
			tone: "info",
			message: usageMessage,
		});
	});

	test("백신이 있는데 모두 끄면 빈 상태가 아니라 빨강으로 알린다", () => {
		let data = filledVaccineGame();
		for (const name of ["5280 ABBNE", "RV-K", "가금 복합백신"]) {
			data = disableVaccine(data, vaccineId(data, name));
		}

		expect(getVaccineUsageNotice(data.vaccines)).toEqual({ tone: "error", message: usageMessage });
	});

	test("한도 안내는 앰버로 5개까지라고 알린다", () => {
		expect(VACCINE_LIMIT_NOTICE).toEqual({
			tone: "info",
			message: "사용 백신은 5개까지입니다. 다른 백신을 쓰려면 하나를 먼저 꺼 주세요.",
		});
	});
});

describe("백신 추가", () => {
	test("목록 끝에 항원 없이 넣는다", () => {
		const added = addVaccine(filledVaccineGame(), vaccineInfo("Vaccine F"));
		const last = added.vaccines.at(-1);

		expect(added.vaccines).toHaveLength(6);
		expect(last).toMatchObject({ ...vaccineInfo("Vaccine F"), antigens: [] });
	});

	test("사용 백신이 5개보다 적으면 켠다", () => {
		const added = addVaccine(filledVaccineGame(), vaccineInfo("Vaccine F"));

		expect(added.vaccines.at(-1)?.isEnabled).toBe(true);
	});

	test("사용 백신이 4개면 켜서 5개가 된다", () => {
		const data = filledVaccineGame();
		const fourth = enableVaccine(data, vaccineId(data, "Vaccine D"));
		if (!fourth.isSuccess) throw new Error("4번째 백신을 켜지 못했습니다");
		const added = addVaccine(fourth.data, vaccineInfo("Vaccine F"));

		expect(added.vaccines.at(-1)?.isEnabled).toBe(true);
		expect(countEnabledVaccines(added.vaccines)).toBe(5);
	});

	test("사용 백신이 이미 5개면 꺼진 채로 넣는다", () => {
		const data = filledVaccineGame();
		for (const vaccine of data.vaccines) vaccine.isEnabled = true;

		expect(addVaccine(data, vaccineInfo("Vaccine F")).vaccines.at(-1)?.isEnabled).toBe(false);
	});

	test("넣을 때마다 새 id 를 붙인다", () => {
		const once = addVaccine(filledVaccineGame(), vaccineInfo("Vaccine F"));
		const twice = addVaccine(once, vaccineInfo("Vaccine G", 2));
		const ids = twice.vaccines.map((vaccine) => vaccine.id);

		expect(new Set(ids).size).toBe(ids.length);
	});
});

describe("백신 수정·삭제", () => {
	test("수정은 이름과 이미지만 바꾸고 사용과 항원은 그대로 둔다", () => {
		const data = filledVaccineGame();
		const id = vaccineId(data, "RV-K");
		const before = data.vaccines.find((vaccine) => vaccine.id === id);
		const updated = updateVaccineInfo(data, id, vaccineInfo("RV-K2", 2));

		expect(updated.vaccines.find((vaccine) => vaccine.id === id)).toEqual({
			...vaccineInfo("RV-K2", 2),
			id,
			isEnabled: true,
			antigens: before?.antigens ?? [],
		});
	});

	test("수정 값에 다른 필드가 섞여 와도 사용과 항원은 바꾸지 않는다", () => {
		const data = filledVaccineGame();
		const id = vaccineId(data, "RV-K");
		const info = { ...vaccineInfo("RV-K2", 2), isEnabled: false, antigens: [] };
		const before = data.vaccines.find((vaccine) => vaccine.id === id);
		const updated = updateVaccineInfo(data, id, info);
		const after = updated.vaccines.find((vaccine) => vaccine.id === id);

		expect(after?.isEnabled).toBe(true);
		expect(after?.antigens).toEqual(before?.antigens ?? []);
	});

	test("삭제하면 그 백신만 빠진다", () => {
		const data = filledVaccineGame();

		expect(productNames(deleteVaccine(data, vaccineId(data, "RV-K")).vaccines)).toEqual([
			"5280 ABBNE",
			"가금 복합백신",
			"Vaccine D",
			"Vaccine E 긴 제품명 줄바꿈 확인",
		]);
	});
});

describe("받은 값", () => {
	test("받은 값을 바꾸지 않고 새 값을 돌려준다", () => {
		const data = deepFreeze(filledVaccineGame());
		const id = vaccineId(data, "Vaccine D");

		expect(() => {
			filterVaccines(data.vaccines, "vaccine");
			enableVaccine(data, id);
			disableVaccine(data, id);
			addVaccine(data, vaccineInfo("Vaccine F"));
			updateVaccineInfo(data, id, vaccineInfo("Vaccine D2"));
			deleteVaccine(data, id);
		}).not.toThrow();
		expect(data).toEqual(filledVaccineGame());
	});
});

describe("저장 규칙과 함께", () => {
	test("첫 실행에서 넣은 백신은 항원을 넣기 전까지 저장할 수 없다", () => {
		const added = addVaccine(emptyVaccineGame(), vaccineInfo("Vaccine F"));

		expect(validateForSave("vaccine-game", added)).toEqual({
			isValid: false,
			issues: [expect.stringContaining("항원은")],
		});
	});

	test("켜진 백신을 모두 지워 사용 백신이 0개면 저장할 수 없다", () => {
		let data = filledVaccineGame();
		for (const name of ["5280 ABBNE", "RV-K", "가금 복합백신"]) {
			data = deleteVaccine(data, vaccineId(data, name));
		}

		expect(validateForSave("vaccine-game", data)).toEqual({
			isValid: false,
			issues: [expect.stringContaining("백신을 1~5개")],
		});
	});

	test("켠 백신이 1개보다 적으면 사용 안내가 보이고 저장 규칙도 막는다", () => {
		let data = filledVaccineGame();

		expect(getVaccineUsageNotice(data.vaccines)).toBeNull();
		expect(validateForSave("vaccine-game", data).isValid).toBe(true);

		for (const name of ["5280 ABBNE", "RV-K", "가금 복합백신"]) {
			data = disableVaccine(data, vaccineId(data, name));
		}

		expect(getVaccineUsageNotice(data.vaccines)).not.toBeNull();
		expect(validateForSave("vaccine-game", data)).toEqual({
			isValid: false,
			issues: [expect.stringContaining("백신을 1~5개")],
		});
	});
});
