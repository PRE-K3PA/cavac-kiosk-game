import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import { validateForSave } from "@/data/rules";
import { LIMITS } from "@/data/schema";
import {
	addSpecies,
	deleteSpecies,
	isSpeciesOnHome,
	SPECIES_FORM_MESSAGES,
	updateSpecies,
	validateSpeciesName,
} from "@/features/admin/speciesForm";
import type { Species } from "@/types/data";

function filledCommon() {
	return createMockData("filled").common;
}

function speciesOf(name: string): Species {
	const species = filledCommon().species.find((item) => item.name === name);
	if (species === undefined) throw new Error(`목데이터에 ${name} 축종이 없습니다`);
	return species;
}

const PIG = speciesOf("돼지");
const SHEEP = speciesOf("양");
const OSTRICH: Species = {
	id: crypto.randomUUID(),
	name: "타조",
	character: `images/species/${crypto.randomUUID()}.png`,
};

describe("validateSpeciesName", () => {
	const species = filledCommon().species;

	test("비어 있거나 공백뿐이면 입력 안내", () => {
		expect(validateSpeciesName("", species)).toBe(SPECIES_FORM_MESSAGES.nameEmpty);
		expect(validateSpeciesName("   ", species)).toBe(SPECIES_FORM_MESSAGES.nameEmpty);
	});

	test("최대 길이를 넘으면 길이 안내", () => {
		const tooLong = "가".repeat(LIMITS.speciesName.max + 1);
		expect(validateSpeciesName(tooLong, species)).toBe(SPECIES_FORM_MESSAGES.nameLength);
		expect(validateSpeciesName("가".repeat(LIMITS.speciesName.max), species)).toBeUndefined();
	});

	test("앞뒤 공백은 길이에 세지 않는다", () => {
		const padded = ` ${"가".repeat(LIMITS.speciesName.max)} `;
		expect(validateSpeciesName(padded, species)).toBeUndefined();
	});

	test("앞뒤 공백을 빼고 같은 이름이 있으면 중복", () => {
		expect(validateSpeciesName(" 돼지 ", species)).toBe(SPECIES_FORM_MESSAGES.nameDuplicate);
		expect(validateSpeciesName("타조", species)).toBeUndefined();
	});

	test("수정 중인 축종 자신과는 중복으로 보지 않는다", () => {
		expect(validateSpeciesName("돼지", species, PIG.id)).toBeUndefined();
		expect(validateSpeciesName("양", species, PIG.id)).toBe(SPECIES_FORM_MESSAGES.nameDuplicate);
	});
});

describe("addSpecies / updateSpecies", () => {
	test("추가하면 목록 끝에 붙고 원본은 그대로다", () => {
		const common = filledCommon();
		const added = addSpecies(common, OSTRICH);

		expect(added.species.at(-1)).toEqual(OSTRICH);
		expect(added.species).toHaveLength(common.species.length + 1);
		expect(common.species).not.toContainEqual(OSTRICH);
		expect(validateForSave("common", added).isValid).toBe(true);
	});

	test("수정하면 같은 자리의 축종만 바뀐다", () => {
		const common = filledCommon();
		const index = common.species.findIndex((item) => item.id === PIG.id);
		const updated = updateSpecies(common, { ...PIG, name: "흑돼지" });

		expect(updated.species[index]).toEqual({ ...PIG, name: "흑돼지" });
		expect(updated.species).toHaveLength(common.species.length);
		expect(common.species[index]).toEqual(PIG);
	});
});

describe("deleteSpecies", () => {
	test("메인 화면에 놓인 축종을 지우면 그 칸도 비워 저장할 수 있다", () => {
		const common = filledCommon();
		expect(isSpeciesOnHome(common.homeAnimals, PIG.id)).toBe(true);

		const deleted = deleteSpecies(common, PIG.id);

		expect(deleted.species.some((item) => item.id === PIG.id)).toBe(false);
		expect(isSpeciesOnHome(deleted.homeAnimals, PIG.id)).toBe(false);
		expect(deleted.homeAnimals).toHaveLength(common.homeAnimals.length - 1);
		expect(validateForSave("common", deleted).isValid).toBe(true);
	});

	test("메인 화면에 없는 축종을 지우면 칸은 그대로다", () => {
		const common = filledCommon();
		expect(isSpeciesOnHome(common.homeAnimals, SHEEP.id)).toBe(false);

		const deleted = deleteSpecies(common, SHEEP.id);

		expect(deleted.homeAnimals).toEqual(common.homeAnimals);
		expect(deleted.species).toHaveLength(common.species.length - 1);
	});
});
