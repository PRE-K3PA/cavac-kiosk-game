import { HOME_SLOTS, type HomeAnimal, type HomeSlot } from "@/types/data";

export const HOME_SLOT_LABEL: Record<HomeSlot, string> = {
	"left-2": "왼쪽 2",
	"left-1": "왼쪽 1",
	"right-1": "오른쪽 1",
	"right-2": "오른쪽 2",
};

export function findHomeAnimal(homeAnimals: HomeAnimal[], slot: HomeSlot): HomeAnimal | undefined {
	return homeAnimals.find((animal) => animal.slot === slot);
}

/**
 * 빈 칸이면 넣고, 찬 칸이면 바꿉니다. 같은 축종을 여러 칸에 둘 수 있습니다 (Figma Q17).
 * 이미 그 동물이 있는 칸이면 받은 목록을 그대로 돌려줘 초안이 바뀌지 않습니다
 */
export function placeHomeAnimal(
	homeAnimals: HomeAnimal[],
	slot: HomeSlot,
	speciesId: string,
): HomeAnimal[] {
	if (findHomeAnimal(homeAnimals, slot)?.speciesId === speciesId) return homeAnimals;

	const others = homeAnimals.filter((animal) => animal.slot !== slot);
	return [...others, { speciesId, slot }].sort(
		(a, b) => HOME_SLOTS.indexOf(a.slot) - HOME_SLOTS.indexOf(b.slot),
	);
}

export function clearHomeAnimal(homeAnimals: HomeAnimal[], slot: HomeSlot): HomeAnimal[] {
	return homeAnimals.filter((animal) => animal.slot !== slot);
}

/** 축종을 지울 때 그 축종이 놓인 칸을 모두 비웁니다. 없는 축종이 남으면 저장할 수 없습니다 */
export function removeSpeciesFromHome(homeAnimals: HomeAnimal[], speciesId: string): HomeAnimal[] {
	return homeAnimals.filter((animal) => animal.speciesId !== speciesId);
}
