import { antigenKey } from "@/data/rules";
import { ANTIGEN_COLOR_KEYS, type AntigenColorKey, type Vaccine } from "@/types/data";

export type AntigenColors = Record<string, AntigenColorKey>;

function shuffle<T>(items: readonly T[], random: () => number): T[] {
	const shuffled = [...items];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/** 한 판 동안 쓸 항원 색. 같은 항원(약어 + 세부 타입)은 어느 백신에 있든 같은 색입니다 */
export function assignAntigenColors(vaccines: Vaccine[], random: () => number): AntigenColors {
	const keys = [...new Set(vaccines.flatMap((vaccine) => vaccine.antigens.map(antigenKey)))];
	const palette = shuffle(ANTIGEN_COLOR_KEYS, random);
	return Object.fromEntries(keys.map((key, index) => [key, palette[index % palette.length]]));
}
