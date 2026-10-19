import { LIMITS } from "@/data/schema";
import type { Vaccine } from "@/types/data";

const RECIPE_BASE_SECONDS = 2;

export function getRoundVaccines(vaccines: Vaccine[]): Vaccine[] {
	return vaccines.filter((vaccine) => vaccine.isEnabled).slice(0, LIMITS.enabledVaccines.max);
}

/** Figma RecipeTimeBar: 백신 1개=3초 ~ 5개=7초 */
export function getRecipeSeconds(vaccineCount: number): number {
	return RECIPE_BASE_SECONDS + vaccineCount;
}
