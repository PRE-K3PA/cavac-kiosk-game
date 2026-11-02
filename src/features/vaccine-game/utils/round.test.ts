import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import {
	getRecipeSeconds,
	getRoundVaccines,
	hasTwoRowRecipe,
	pinnedAntigensLast,
	RECIPE_ROW_MAX_ANTIGENS,
} from "@/features/vaccine-game/utils/round";
import type { Antigen, Vaccine } from "@/types/data";

function mockVaccines(): Vaccine[] {
	return createMockData("filled")["vaccine-game"].vaccines;
}

function antigen(abbr: string, isPinned: boolean): Antigen {
	return { id: `antigen-${abbr}`, abbr, subtype: null, pathogenType: "virus", isPinned };
}

function vaccineWith(antigens: Antigen[]): Vaccine {
	return { ...mockVaccines()[0], antigens };
}

function abbrs(vaccine: Vaccine): string[] {
	return vaccine.antigens.map((item) => item.abbr);
}

describe("pinnedAntigensLast", () => {
	test("고정 항원을 맨 뒤로 보내고, 묶음 안에서는 입력 순서를 지킨다", () => {
		const vaccine = vaccineWith([
			antigen("A", true),
			antigen("B", false),
			antigen("C", true),
			antigen("D", false),
		]);

		expect(abbrs(pinnedAntigensLast(vaccine))).toEqual(["B", "D", "A", "C"]);
	});

	test("고정 항원이 없거나 모두 고정이면 순서가 그대로다", () => {
		const none = vaccineWith([antigen("A", false), antigen("B", false)]);
		const all = vaccineWith([antigen("A", true), antigen("B", true)]);

		expect(abbrs(pinnedAntigensLast(none))).toEqual(["A", "B"]);
		expect(abbrs(pinnedAntigensLast(all))).toEqual(["A", "B"]);
	});

	test("받은 백신을 바꾸지 않는다", () => {
		const vaccine = vaccineWith([antigen("A", true), antigen("B", false)]);
		const before = structuredClone(vaccine);

		pinnedAntigensLast(vaccine);

		expect(vaccine).toEqual(before);
	});
});

describe("getRoundVaccines", () => {
	test("이번 판 백신은 고정 항원이 맨 뒤에 온다", () => {
		const round = getRoundVaccines(mockVaccines());

		for (const vaccine of round) {
			const firstPinned = vaccine.antigens.findIndex((item) => item.isPinned);
			if (firstPinned === -1) continue;
			expect(vaccine.antigens.slice(firstPinned).every((item) => item.isPinned)).toBe(true);
		}
		expect(round.some((vaccine) => vaccine.antigens.some((item) => item.isPinned))).toBe(true);
	});

	test("켜진 백신만 관리자 목록 순서대로 고른다", () => {
		const vaccines = mockVaccines().map((vaccine, index) => ({
			...vaccine,
			isEnabled: index % 2 === 0,
		}));

		const round = getRoundVaccines(vaccines);

		expect(round.map((vaccine) => vaccine.id)).toEqual(
			vaccines.filter((vaccine) => vaccine.isEnabled).map((vaccine) => vaccine.id),
		);
	});

	test("켜진 백신이 5개를 넘으면 앞에서 5개만 쓴다", () => {
		const base = mockVaccines()[0];
		const vaccines = Array.from({ length: 7 }, (_, index) => ({
			...base,
			id: `vaccine-${index}`,
			isEnabled: true,
		}));

		expect(getRoundVaccines(vaccines).map((vaccine) => vaccine.id)).toEqual([
			"vaccine-0",
			"vaccine-1",
			"vaccine-2",
			"vaccine-3",
			"vaccine-4",
		]);
	});

	test("켜진 백신이 없으면 빈 목록을 돌려준다", () => {
		const vaccines = mockVaccines().map((vaccine) => ({ ...vaccine, isEnabled: false }));

		expect(getRoundVaccines(vaccines)).toEqual([]);
	});

	test("받은 목록을 바꾸지 않는다", () => {
		const vaccines = mockVaccines();
		const before = structuredClone(vaccines);

		getRoundVaccines(vaccines);

		expect(vaccines).toEqual(before);
	});
});

describe("getRecipeSeconds", () => {
	test("레시피 시간은 2초에 백신 수를 더한다", () => {
		expect([1, 2, 3, 4, 5].map(getRecipeSeconds)).toEqual([3, 4, 5, 6, 7]);
	});
});

describe("hasTwoRowRecipe", () => {
	function withAntigenCounts(...counts: number[]): Vaccine[] {
		const base = mockVaccines()[0];
		return counts.map((count, index) => ({
			...base,
			id: `v${index}`,
			antigens: Array.from({ length: count }, (_, n) => ({
				...base.antigens[0],
				id: `v${index}-a${n}`,
				abbr: `A${n}`,
			})),
		}));
	}

	test(`모든 레시피의 항원이 ${RECIPE_ROW_MAX_ANTIGENS}개 이하면 두 줄 카드가 없다`, () => {
		expect(hasTwoRowRecipe(withAntigenCounts(1, 2, RECIPE_ROW_MAX_ANTIGENS))).toBe(false);
	});

	test(`항원이 ${RECIPE_ROW_MAX_ANTIGENS + 1}개인 레시피가 있으면 두 줄 카드가 있다`, () => {
		expect(hasTwoRowRecipe(withAntigenCounts(1, RECIPE_ROW_MAX_ANTIGENS + 1))).toBe(true);
	});

	test("여러 레시피 중 하나만 두 줄이어도 두 줄 카드가 있다", () => {
		expect(hasTwoRowRecipe(withAntigenCounts(1, 2, 3, 5, 2))).toBe(true);
	});

	test("레시피가 없으면 두 줄 카드가 없다", () => {
		expect(hasTwoRowRecipe([])).toBe(false);
	});
});
