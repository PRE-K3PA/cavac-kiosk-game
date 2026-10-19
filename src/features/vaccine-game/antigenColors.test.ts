import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import { antigenKey } from "@/data/rules";
import { assignAntigenColors } from "@/features/vaccine-game/antigenColors";
import { ANTIGEN_COLOR_KEYS, type Antigen, type Vaccine } from "@/types/data";

function antigen(abbr: string, subtype: string | null = null): Antigen {
	return { id: `${abbr}-${subtype}`, abbr, subtype, pathogenType: "virus", isPinned: false };
}

function vaccine(id: string, antigens: Antigen[]): Vaccine {
	return { ...createMockData("filled")["vaccine-game"].vaccines[0], id, antigens };
}

function fixedRandom() {
	return 0;
}

describe("assignAntigenColors", () => {
	test("다른 백신의 같은 항원은 같은 색을 받는다", () => {
		const vaccines = [
			vaccine("a", [antigen("ND"), antigen("IB")]),
			vaccine("b", [antigen("ND"), antigen("AI", "Y280")]),
		];

		const colors = assignAntigenColors(vaccines, Math.random);

		expect(colors[antigenKey(antigen("ND"))]).toBeDefined();
		expect(Object.keys(colors)).toHaveLength(3);
	});

	test("약어가 같아도 세부 타입이 다르면 다른 항원으로 보고 다른 색을 준다", () => {
		const colors = assignAntigenColors(
			[vaccine("a", [antigen("AI"), antigen("AI", "Y280")])],
			fixedRandom,
		);

		expect(colors[antigenKey(antigen("AI"))]).not.toBe(colors[antigenKey(antigen("AI", "Y280"))]);
	});

	test("항원 25개까지는 서로 겹치지 않는 색을 준다", () => {
		const antigens = Array.from({ length: 25 }, (_, index) => antigen(`A${index}`));
		const vaccines = [0, 1, 2, 3, 4].map((group) =>
			vaccine(`v${group}`, antigens.slice(group * 5, group * 5 + 5)),
		);

		const colors = Object.values(assignAntigenColors(vaccines, Math.random));

		expect(new Set(colors).size).toBe(25);
		for (const color of colors) expect(ANTIGEN_COLOR_KEYS).toContain(color);
	});

	test("랜덤 값이 같으면 같은 색을 돌려준다", () => {
		const vaccines = createMockData("filled")["vaccine-game"].vaccines;

		expect(assignAntigenColors(vaccines, fixedRandom)).toEqual(
			assignAntigenColors(vaccines, fixedRandom),
		);
	});

	test("받은 목록을 바꾸지 않는다", () => {
		const vaccines = createMockData("filled")["vaccine-game"].vaccines;
		const before = structuredClone(vaccines);

		assignAntigenColors(vaccines, Math.random);

		expect(vaccines).toEqual(before);
	});
});
