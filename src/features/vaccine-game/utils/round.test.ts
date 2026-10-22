import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import { getRecipeSeconds, getRoundVaccines } from "@/features/vaccine-game/utils/round";
import type { Vaccine } from "@/types/data";

function mockVaccines(): Vaccine[] {
	return createMockData("filled")["vaccine-game"].vaccines;
}

describe("getRoundVaccines", () => {
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
