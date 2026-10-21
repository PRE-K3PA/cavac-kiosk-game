import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import { validateForSave } from "@/data/rules";
import {
	clearHomeAnimal,
	findHomeAnimal,
	placeHomeAnimal,
	removeSpeciesFromHome,
} from "@/features/admin/homeAnimals";
import { HOME_SLOTS, type HomeAnimal } from "@/types/data";

function speciesIdOf(name: string): string {
	const species = createMockData("filled").common.species.find((item) => item.name === name);
	if (species === undefined) throw new Error(`목데이터에 ${name} 축종이 없습니다`);
	return species.id;
}

const PIG = speciesIdOf("돼지");
const DOG = speciesIdOf("강아지");
const CAT = speciesIdOf("고양이");
const CHICKEN = speciesIdOf("닭");
const SHEEP = speciesIdOf("양");

/** 목데이터 배치: 왼쪽 2 돼지, 왼쪽 1 강아지, 오른쪽 1 고양이, 오른쪽 2 닭 */
function filledHomeAnimals(): HomeAnimal[] {
	return createMockData("filled").common.homeAnimals;
}

function slotsOf(homeAnimals: HomeAnimal[]) {
	return homeAnimals.map((animal) => animal.slot);
}

function canSave(homeAnimals: HomeAnimal[]) {
	const common = { ...createMockData("empty").common, homeAnimals };
	return validateForSave("common", common).isValid;
}

describe("칸 찾기", () => {
	test("그 칸의 동물을 돌려준다", () => {
		expect(findHomeAnimal(filledHomeAnimals(), "left-1")).toEqual({
			speciesId: DOG,
			slot: "left-1",
		});
	});

	test("빈 칸이면 undefined 를 돌려준다", () => {
		const homeAnimals: HomeAnimal[] = [{ speciesId: CAT, slot: "right-2" }];

		expect(findHomeAnimal(homeAnimals, "left-1")).toBe(undefined);
	});

	test("빈 목록이면 어느 칸에서도 찾을 수 없다", () => {
		for (const slot of HOME_SLOTS) {
			expect(findHomeAnimal([], slot)).toBe(undefined);
		}
	});
});

describe("동물 넣기와 바꾸기", () => {
	test("빈 칸에 넣으면 칸 순서(왼쪽 2, 왼쪽 1, 오른쪽 1, 오른쪽 2)대로 놓인다", () => {
		const placed = placeHomeAnimal([{ speciesId: CAT, slot: "right-2" }], "left-1", DOG);

		expect(placed).toEqual([
			{ speciesId: DOG, slot: "left-1" },
			{ speciesId: CAT, slot: "right-2" },
		]);
	});

	test("빈 목록에 차례로 넣어도 칸 순서가 유지된다", () => {
		let homeAnimals: HomeAnimal[] = [];
		for (const slot of [...HOME_SLOTS].reverse()) {
			homeAnimals = placeHomeAnimal(homeAnimals, slot, SHEEP);
		}

		expect(slotsOf(homeAnimals)).toEqual([...HOME_SLOTS]);
	});

	test("찬 칸에 넣으면 그 칸의 동물만 바뀌고 칸 수는 그대로다", () => {
		const replaced = placeHomeAnimal(filledHomeAnimals(), "left-1", SHEEP);

		expect(replaced).toEqual([
			{ speciesId: PIG, slot: "left-2" },
			{ speciesId: SHEEP, slot: "left-1" },
			{ speciesId: CAT, slot: "right-1" },
			{ speciesId: CHICKEN, slot: "right-2" },
		]);
	});

	test("같은 축종을 여러 칸에 둘 수 있다", () => {
		const placed = placeHomeAnimal(filledHomeAnimals(), "right-2", DOG);

		expect(findHomeAnimal(placed, "left-1")?.speciesId).toBe(DOG);
		expect(findHomeAnimal(placed, "right-2")?.speciesId).toBe(DOG);
	});

	test("이미 그 동물이 있는 칸에 같은 동물을 넣으면 받은 목록을 그대로 돌려준다", () => {
		const homeAnimals = filledHomeAnimals();

		expect(placeHomeAnimal(homeAnimals, "left-1", DOG)).toBe(homeAnimals);
	});
});

describe("칸 비우기", () => {
	test("그 칸만 비우고 나머지 칸 순서는 그대로다", () => {
		expect(slotsOf(clearHomeAnimal(filledHomeAnimals(), "left-1"))).toEqual([
			"left-2",
			"right-1",
			"right-2",
		]);
	});

	test("빈 칸을 비우면 내용이 그대로다", () => {
		const homeAnimals: HomeAnimal[] = [{ speciesId: CAT, slot: "right-2" }];

		expect(clearHomeAnimal(homeAnimals, "left-1")).toEqual(homeAnimals);
	});
});

describe("축종을 지울 때", () => {
	test("그 축종이 놓인 칸을 모두 비운다", () => {
		const homeAnimals = placeHomeAnimal(filledHomeAnimals(), "right-2", DOG);

		expect(removeSpeciesFromHome(homeAnimals, DOG)).toEqual([
			{ speciesId: PIG, slot: "left-2" },
			{ speciesId: CAT, slot: "right-1" },
		]);
	});

	test("어느 칸에도 없는 축종이면 내용이 그대로다", () => {
		expect(removeSpeciesFromHome(filledHomeAnimals(), SHEEP)).toEqual(filledHomeAnimals());
	});
});

describe("받은 값", () => {
	test("받은 목록을 바꾸지 않고 새 목록을 돌려준다", () => {
		const homeAnimals = filledHomeAnimals();
		for (const animal of homeAnimals) Object.freeze(animal);
		Object.freeze(homeAnimals);

		const placed = placeHomeAnimal(homeAnimals, "left-1", SHEEP);
		const cleared = clearHomeAnimal(homeAnimals, "right-1");
		const removed = removeSpeciesFromHome(homeAnimals, CAT);

		expect(homeAnimals).toEqual(filledHomeAnimals());
		expect(placed).not.toBe(homeAnimals);
		expect(cleared).not.toBe(homeAnimals);
		expect(removed).not.toBe(homeAnimals);
	});
});

describe("저장 규칙과 함께", () => {
	test("아무 칸에도 넣지 않은 빈 목록은 저장할 수 있다", () => {
		expect(canSave([])).toBe(true);
	});

	test("네 칸 모두 같은 축종을 넣어도 저장할 수 있다", () => {
		let homeAnimals: HomeAnimal[] = [];
		for (const slot of HOME_SLOTS) {
			homeAnimals = placeHomeAnimal(homeAnimals, slot, DOG);
		}

		expect(homeAnimals).toEqual(HOME_SLOTS.map((slot) => ({ speciesId: DOG, slot })));
		expect(canSave(homeAnimals)).toBe(true);
	});

	test("네 칸 모두 다른 축종을 넣어도 저장할 수 있다", () => {
		const speciesIds = [PIG, DOG, CAT, CHICKEN];
		let homeAnimals: HomeAnimal[] = [];
		HOME_SLOTS.forEach((slot, index) => {
			homeAnimals = placeHomeAnimal(homeAnimals, slot, speciesIds[index]);
		});

		expect(homeAnimals.map((animal) => animal.speciesId)).toEqual(speciesIds);
		expect(canSave(homeAnimals)).toBe(true);
	});

	test("넣고, 바꾸고, 비운 결과는 저장할 수 있다", () => {
		let homeAnimals = placeHomeAnimal([], "right-1", CAT);
		homeAnimals = placeHomeAnimal(homeAnimals, "left-2", PIG);
		homeAnimals = placeHomeAnimal(homeAnimals, "right-1", DOG);
		homeAnimals = placeHomeAnimal(homeAnimals, "left-1", DOG);
		homeAnimals = clearHomeAnimal(homeAnimals, "left-2");

		expect(canSave(homeAnimals)).toBe(true);
	});

	test("네 칸을 모두 채우고 다시 넣어도 4칸을 넘지 않는다", () => {
		let homeAnimals = filledHomeAnimals();
		for (const slot of HOME_SLOTS) {
			homeAnimals = placeHomeAnimal(homeAnimals, slot, SHEEP);
		}

		expect(homeAnimals).toHaveLength(HOME_SLOTS.length);
		expect(canSave(homeAnimals)).toBe(true);
	});

	test("축종을 지우며 그 칸도 비우면 없는 축종이 남지 않아 저장할 수 있다", () => {
		const common = createMockData("filled").common;
		const species = common.species.filter((item) => item.id !== DOG);
		const homeAnimals = removeSpeciesFromHome(common.homeAnimals, DOG);

		expect(validateForSave("common", { ...common, species }).isValid).toBe(false);
		expect(validateForSave("common", { ...common, species, homeAnimals }).isValid).toBe(true);
	});
});
