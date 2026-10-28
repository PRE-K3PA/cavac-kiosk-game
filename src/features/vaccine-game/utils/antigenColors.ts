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

function antigenKeysOf(vaccines: Vaccine[]): string[] {
	return vaccines.flatMap((vaccine) => vaccine.antigens.map(antigenKey));
}

/**
 * 한 판 동안 쓸 항원 색. 같은 항원(약어 + 세부 타입)은 어느 백신에 있든 같은 색입니다.
 * 오답 구슬은 판 밖 백신에서도 나오므로, 이번 판 항원에 먼저 색을 주고 남은 색을 판 밖 항원에 줍니다
 */
export function assignAntigenColors(
	round: Vaccine[],
	allVaccines: Vaccine[],
	random: () => number,
): AntigenColors {
	const keys = [...new Set([...antigenKeysOf(round), ...antigenKeysOf(allVaccines)])];
	const palette = shuffle(ANTIGEN_COLOR_KEYS, random);
	return Object.fromEntries(keys.map((key, index) => [key, palette[index % palette.length]]));
}
