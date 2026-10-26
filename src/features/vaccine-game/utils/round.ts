import { LIMITS } from "@/data/schema";
import type { Vaccine } from "@/types/data";

const RECIPE_BASE_SECONDS = 2;

/** 고정 항원은 처음부터 담겨 있으므로, 모아야 할 항원이 먼저 보이게 게임 화면에서는 맨 뒤에 둔다 */
export function pinnedAntigensLast(vaccine: Vaccine): Vaccine {
	const unpinned = vaccine.antigens.filter((antigen) => !antigen.isPinned);
	const pinned = vaccine.antigens.filter((antigen) => antigen.isPinned);
	return { ...vaccine, antigens: [...unpinned, ...pinned] };
}

export function getRoundVaccines(vaccines: Vaccine[]): Vaccine[] {
	return vaccines
		.filter((vaccine) => vaccine.isEnabled)
		.slice(0, LIMITS.enabledVaccines.max)
		.map(pinnedAntigensLast);
}

/** Figma RecipeTimeBar: 백신 1개=3초 ~ 5개=7초 */
export function getRecipeSeconds(vaccineCount: number): number {
	return RECIPE_BASE_SECONDS + vaccineCount;
}
