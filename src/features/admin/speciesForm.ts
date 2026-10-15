import { LIMITS } from "@/data/schema";
import { removeSpeciesFromHome } from "@/features/admin/homeAnimals";
import type { CommonData, HomeAnimal, Species } from "@/types/data";

const { min, max } = LIMITS.speciesName;

export const SPECIES_FORM_MESSAGES = {
	nameEmpty: "축종명을 입력해 주세요.",
	nameLength: `축종명은 ${min}~${max}자로 입력해 주세요.`,
	nameDuplicate: "이미 등록된 축종명입니다.",
	imageEmpty: "캐릭터 이미지를 넣어 주세요",
} as const;

export const SPECIES_HOME_WARNING =
	"메인 화면 칸에 쓰이는 축종입니다. 삭제하면 그 칸이 비워집니다.";

/** 저장 규칙(src/data/rules.ts)처럼 앞뒤 공백을 뺀 이름으로 길이와 중복을 봅니다 */
export function validateSpeciesName(
	name: string,
	species: Species[],
	editingId?: string,
): string | undefined {
	const trimmed = name.trim();
	if (trimmed.length === 0) return SPECIES_FORM_MESSAGES.nameEmpty;
	if (trimmed.length < min || trimmed.length > max) return SPECIES_FORM_MESSAGES.nameLength;

	const isDuplicate = species.some((item) => item.id !== editingId && item.name.trim() === trimmed);
	return isDuplicate ? SPECIES_FORM_MESSAGES.nameDuplicate : undefined;
}

export function addSpecies(common: CommonData, species: Species): CommonData {
	return { ...common, species: [...common.species, species] };
}

export function updateSpecies(common: CommonData, species: Species): CommonData {
	return {
		...common,
		species: common.species.map((item) => (item.id === species.id ? species : item)),
	};
}

/** 지운 축종을 가리키는 메인 화면 칸이 남으면 저장할 수 없어서, 칸도 함께 비웁니다 */
export function deleteSpecies(common: CommonData, speciesId: string): CommonData {
	return {
		...common,
		species: common.species.filter((item) => item.id !== speciesId),
		homeAnimals: removeSpeciesFromHome(common.homeAnimals, speciesId),
	};
}

export function isSpeciesOnHome(homeAnimals: HomeAnimal[], speciesId: string): boolean {
	return homeAnimals.some((animal) => animal.speciesId === speciesId);
}
