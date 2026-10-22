import { LIMITS } from "@/data/schema";
import type { Penalty } from "@/types/data";

// 오답 패널티 두 줄(시간 차감, 점수 차감)의 편집 규칙. 백신 설정과 카드 설정이 같은 Penalty 를 씁니다

export type PenaltyKey = keyof Penalty;

const PENALTY_UNITS = { time: "초", score: "점" } as const satisfies Record<PenaltyKey, string>;

export const PENALTY_ROWS = [
	{ key: "time", label: "시간 차감", unit: PENALTY_UNITS.time },
	{ key: "score", label: "점수 차감", unit: PENALTY_UNITS.score },
] as const satisfies readonly { key: PenaltyKey; label: string; unit: string }[];

export const PENALTY_LIMITS = {
	time: LIMITS.penaltySeconds,
	score: LIMITS.penaltyPoints,
} as const satisfies Record<PenaltyKey, { min: number; max: number }>;

/** 칸을 비우면 범위 밖 값 0 을 넣어 저장 규칙이 저장을 막게 합니다. 입력 칸에는 빈 칸으로 보입니다 */
const BLANK_PENALTY_VALUE = 0;

function getPenaltyValue(penalty: Penalty, key: PenaltyKey): number {
	return key === "time" ? penalty.time.seconds : penalty.score.points;
}

function isPenaltyInRange(penalty: Penalty, key: PenaltyKey): boolean {
	const value = getPenaltyValue(penalty, key);
	return value >= PENALTY_LIMITS[key].min && value <= PENALTY_LIMITS[key].max;
}

/** 입력 칸에 보여 줄 값. 비운 칸이면 null 입니다 */
export function getPenaltyInputValue(penalty: Penalty, key: PenaltyKey): number | null {
	const value = getPenaltyValue(penalty, key);
	return value === BLANK_PENALTY_VALUE ? null : value;
}

/** 행 아래 오류 문구. 비운 칸은 Figma _PenaltyEmpty 문구, 범위 밖 값은 허용 범위를 알려 줍니다 */
export function getPenaltyErrorMessage(penalty: Penalty, key: PenaltyKey): string | null {
	if (isPenaltyInRange(penalty, key)) return null;
	if (getPenaltyInputValue(penalty, key) === null) return "패널티 값을 입력해 주세요.";

	const { min, max } = PENALTY_LIMITS[key];
	return `${min}~${max}${PENALTY_UNITS[key]} 사이로 입력해 주세요.`;
}

export function setPenaltyValue(penalty: Penalty, key: PenaltyKey, value: number | null): Penalty {
	const next = value ?? BLANK_PENALTY_VALUE;
	return key === "time"
		? { ...penalty, time: { ...penalty.time, seconds: next } }
		: { ...penalty, score: { ...penalty.score, points: next } };
}

/** 꺼진 줄은 오류가 보이지 않으므로, 범위 밖 값으로 끄면 원래 값으로 되돌려 저장이 몰래 막히지 않게 합니다 */
export function setPenaltyEnabled(
	penalty: Penalty,
	original: Penalty,
	key: PenaltyKey,
	isEnabled: boolean,
): Penalty {
	const base =
		!isEnabled && !isPenaltyInRange(penalty, key)
			? setPenaltyValue(penalty, key, getPenaltyValue(original, key))
			: penalty;
	return key === "time"
		? { ...base, time: { ...base.time, isEnabled } }
		: { ...base, score: { ...base.score, isEnabled } };
}
