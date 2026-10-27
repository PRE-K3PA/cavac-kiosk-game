import { antigenKey } from "@/data/rules";
import type { Antigen, Vaccine } from "@/types/data";

// Figma 에 없는 값이라 이번에 정했다. 낙하 속도 100% 에서 가로 화면 높이(914)를 약 3초에 지난다
const BASE_FALL_SPEED = 300;
const SPAWN_GAP_MS = 600;
/** 오답 구슬은 빠르게 떨어뜨려 틀렸다는 느낌을 준다 */
export const WRONG_FALL_MULTIPLIER = 2.5;

export type FallingJudgement = "correct" | "wrong";

export type FallingAntigen = {
	id: number;
	antigen: Antigen;
	x: number;
	/** 구슬 아래 끝의 위치. 0 이면 화면 위쪽 바깥에서 막 들어오는 중이다 */
	y: number;
	judgement?: FallingJudgement;
	/** 판정한 시점(게임 경과 ms). 정답 구슬은 표시를 잠깐 보여 준 뒤 지운다 */
	judgedAtMs?: number;
};

export type FallingField = {
	width: number;
	height: number;
	ballSize: number;
};

export function createFallingAntigen(id: number, antigen: Antigen, x: number): FallingAntigen {
	return { id, antigen, x, y: 0 };
}

function uniqueByKey(antigens: Antigen[]): Antigen[] {
	const byKey = new Map(antigens.map((antigen) => [antigenKey(antigen), antigen]));
	return [...byKey.values()];
}

function antigensOutside(current: Vaccine, vaccines: Vaccine[]): Antigen[] {
	const currentKeys = new Set(current.antigens.map(antigenKey));
	return uniqueByKey(
		vaccines
			.flatMap((vaccine) => vaccine.antigens)
			.filter((antigen) => !currentKeys.has(antigenKey(antigen))),
	);
}

/**
 * 오답으로 떨어뜨릴 항원. 이번 판 다른 백신에서 고르고, 없으면 전체 백신에서 고른다.
 * 지금 백신에서 이미 모은 항원(고정 항원 포함)도 다시 고르면 오답이라 함께 넣는다
 */
export function getDistractors(
	current: Vaccine,
	round: Vaccine[],
	all: Vaccine[],
	collectedKeys: string[],
): Antigen[] {
	const fromRound = antigensOutside(current, round);
	const outside = fromRound.length > 0 ? fromRound : antigensOutside(current, all);
	const collected = current.antigens.filter((antigen) =>
		collectedKeys.includes(antigenKey(antigen)),
	);
	return [...outside, ...collected];
}

function pickOne<T>(items: T[], random: () => number): T {
	return items[Math.floor(random() * items.length)];
}

function countFalling(falling: FallingAntigen[]): Map<string, number> {
	const counts = new Map<string, number>();
	for (const item of falling) {
		if (item.judgement) continue;
		const key = antigenKey(item.antigen);
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}
	return counts;
}

/** 화면에 가장 적게 떨어지고 있는 항원들 중에서 고른다. 같은 항원이 몰리지 않게 한다 */
function pickLeastFalling(
	candidates: Antigen[],
	counts: Map<string, number>,
	random: () => number,
): Antigen {
	function countOf(antigen: Antigen): number {
		return counts.get(antigenKey(antigen)) ?? 0;
	}

	const fewest = Math.min(...candidates.map(countOf));
	return pickOne(
		candidates.filter((antigen) => countOf(antigen) === fewest),
		random,
	);
}

/**
 * 필요한 항원이 하나도 떨어지고 있지 않으면 반드시 필요한 항원을 고른다.
 * 그 밖에는 필요한 항원과 다른 항원 중 화면에 가장 적게 떨어지고 있는 것을 골라 고루 섞는다
 */
export function pickSpawnAntigen(
	needed: Antigen[],
	distractors: Antigen[],
	falling: FallingAntigen[],
	random: () => number,
): Antigen | null {
	const counts = countFalling(falling);
	const hasNeededFalling = needed.some((antigen) => counts.has(antigenKey(antigen)));
	if (needed.length > 0 && !hasNeededFalling) return pickLeastFalling(needed, counts, random);

	const candidates = uniqueByKey([...needed, ...distractors]);
	return candidates.length > 0 ? pickLeastFalling(candidates, counts, random) : null;
}

/** 구슬 폭으로 나눈 칸 중, 위쪽에 막 떨어지기 시작한 구슬이 없는 칸을 고른다 */
export function pickSpawnX(
	falling: FallingAntigen[],
	field: FallingField,
	random: () => number,
): number | null {
	const laneCount = Math.max(1, Math.floor(field.width / field.ballSize));
	const laneWidth = field.width / laneCount;
	const lanes = Array.from(
		{ length: laneCount },
		(_, lane) => lane * laneWidth + (laneWidth - field.ballSize) / 2,
	);
	const freeLanes = lanes.filter(
		(x) =>
			!falling.some((item) => item.y < field.ballSize && Math.abs(item.x - x) < field.ballSize),
	);
	return freeLanes.length > 0 ? pickOne(freeLanes, random) : null;
}

export function shouldSpawn(
	falling: FallingAntigen[],
	maxOnScreen: number,
	msSinceLastSpawn: number,
): boolean {
	return falling.length < maxOnScreen && msSinceLastSpawn >= SPAWN_GAP_MS;
}

/** 정답 구슬은 약병으로 날아가는 동안 멈추고, 오답 구슬은 빠르게 떨어진다 */
function getItemSpeed(item: FallingAntigen, speedPerSecond: number): number {
	if (item.judgement === "correct") return 0;
	if (item.judgement === "wrong") return speedPerSecond * WRONG_FALL_MULTIPLIER;
	return speedPerSecond;
}

export function stepFalling(
	falling: FallingAntigen[],
	deltaMs: number,
	speedPerSecond: number,
	fieldHeight: number,
): FallingAntigen[] {
	return falling
		.map((item) => ({ ...item, y: item.y + (getItemSpeed(item, speedPerSecond) * deltaMs) / 1000 }))
		.filter((item) => item.y < fieldHeight);
}

/** 화면 px/초. fallSpeedPercent 는 관리자 설정(50~150) */
export function getFallSpeed(fallSpeedPercent: number): number {
	return (BASE_FALL_SPEED * fallSpeedPercent) / 100;
}
