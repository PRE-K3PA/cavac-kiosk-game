import { antigenKey } from "@/data/rules";
import type { Antigen, Penalty, Vaccine, VaccineGameSettings } from "@/types/data";

// 팀 결정: 100점 단위. 콤보·완성 점수 값은 Figma 에 없어 이번에 정했다
export const SCORE = { correct: 100, complete: 100, combo: 100 } as const;
export const COMBO_START = 3;

type AntigenRef = Pick<Antigen, "abbr" | "subtype">;

export type TapOutcome = "correct" | "wrong" | "ignored";

export type VaccineGame = {
	vaccines: Vaccine[];
	vaccineIndex: number;
	/** 지금 만드는 백신에 담긴 항원(antigenKey). 고정 항원은 처음부터 들어 있다 */
	collectedKeys: string[];
	score: number;
	completedCount: number;
	combo: number;
	correctCount: number;
	durationMs: number;
	elapsedMs: number;
	penaltyMs: number;
	/** 마지막으로 정답을 고르거나 새 백신을 시작한 시점. 힌트는 여기서부터 센다 */
	progressAtMs: number;
	hint: VaccineGameSettings["hint"];
	penalty: Penalty;
};

export type GameResult = {
	score: number;
	vaccines: Vaccine[];
	isAllWrong: boolean;
};

function pinnedKeys(vaccine: Vaccine): string[] {
	return vaccine.antigens.filter((antigen) => antigen.isPinned).map(antigenKey);
}

function hasAntigenToCollect(vaccine: Vaccine): boolean {
	return vaccine.antigens.some((antigen) => !antigen.isPinned);
}

/** from 부터 돌면서 모을 항원이 있는 백신을 찾는다. 모두 고정이면 from 을 그대로 쓴다 */
function findPlayableIndex(vaccines: Vaccine[], from: number): number {
	for (let step = 0; step < vaccines.length; step++) {
		const index = (from + step) % vaccines.length;
		if (hasAntigenToCollect(vaccines[index])) return index;
	}
	return from % vaccines.length;
}

function startVaccine(game: VaccineGame, from: number): VaccineGame {
	const vaccineIndex = findPlayableIndex(game.vaccines, from);
	return {
		...game,
		vaccineIndex,
		collectedKeys: pinnedKeys(game.vaccines[vaccineIndex]),
		progressAtMs: game.elapsedMs,
	};
}

export function createGame(
	vaccines: Vaccine[],
	settings: VaccineGameSettings,
	playDurationSeconds: number,
): VaccineGame {
	const game: VaccineGame = {
		vaccines,
		vaccineIndex: 0,
		collectedKeys: [],
		score: 0,
		completedCount: 0,
		combo: 0,
		correctCount: 0,
		durationMs: playDurationSeconds * 1000,
		elapsedMs: 0,
		penaltyMs: 0,
		progressAtMs: 0,
		hint: settings.hint,
		penalty: settings.penalty,
	};
	return vaccines.length === 0 ? game : startVaccine(game, 0);
}

export function getCurrentVaccine(game: VaccineGame): Vaccine {
	return game.vaccines[game.vaccineIndex];
}

export function getNeededAntigens(game: VaccineGame): Antigen[] {
	const vaccine = getCurrentVaccine(game);
	if (!vaccine) return [];
	return vaccine.antigens.filter((antigen) => !game.collectedKeys.includes(antigenKey(antigen)));
}

export function getRemainingMs(game: VaccineGame): number {
	return Math.max(0, game.durationMs - game.elapsedMs - game.penaltyMs);
}

export function isGameOver(game: VaccineGame): boolean {
	return getRemainingMs(game) === 0;
}

export function tickGame(game: VaccineGame, deltaMs: number): VaccineGame {
	if (isGameOver(game)) return game;
	return { ...game, elapsedMs: game.elapsedMs + deltaMs };
}

function judge(game: VaccineGame, antigen: AntigenRef): TapOutcome {
	if (isGameOver(game)) return "ignored";
	const key = antigenKey(antigen);
	const isInVaccine = getCurrentVaccine(game)?.antigens.some((item) => antigenKey(item) === key);
	if (!isInVaccine) return "wrong";
	// 팀 결정(10-06): 이미 모은 항원(고정 항원 포함)을 다시 고르면 오답
	return game.collectedKeys.includes(key) ? "wrong" : "correct";
}

function applyCorrect(game: VaccineGame, antigen: AntigenRef): VaccineGame {
	const combo = game.combo + 1;
	const comboBonus = combo >= COMBO_START ? SCORE.combo : 0;
	const collected: VaccineGame = {
		...game,
		collectedKeys: [...game.collectedKeys, antigenKey(antigen)],
		score: game.score + SCORE.correct + comboBonus,
		combo,
		correctCount: game.correctCount + 1,
		progressAtMs: game.elapsedMs,
	};
	if (getNeededAntigens(collected).length > 0) return collected;

	const completed = {
		...collected,
		score: collected.score + SCORE.complete,
		completedCount: collected.completedCount + 1,
	};
	return startVaccine(completed, completed.vaccineIndex + 1);
}

function applyWrong(game: VaccineGame): VaccineGame {
	const { time, score } = game.penalty;
	return {
		...game,
		combo: 0,
		score: score.isEnabled ? Math.max(0, game.score - score.points) : game.score,
		penaltyMs: time.isEnabled ? game.penaltyMs + time.seconds * 1000 : game.penaltyMs,
	};
}

export function tapAntigen(
	game: VaccineGame,
	antigen: AntigenRef,
): { game: VaccineGame; outcome: TapOutcome } {
	const outcome = judge(game, antigen);
	if (outcome === "correct") return { game: applyCorrect(game, antigen), outcome };
	if (outcome === "wrong") return { game: applyWrong(game), outcome };
	return { game, outcome };
}

export function isHintActive(game: VaccineGame): boolean {
	if (!game.hint.isEnabled || isGameOver(game) || getNeededAntigens(game).length === 0) {
		return false;
	}
	return game.elapsedMs - game.progressAtMs >= game.hint.delaySeconds * 1000;
}

/** VaccineBottle 의 fill(0~100). 담긴 항원 수 ÷ 필요한 항원 수 */
export function getBottleFill(game: VaccineGame): number {
	const vaccine = getCurrentVaccine(game);
	if (!vaccine || vaccine.antigens.length === 0) return 0;
	return (game.collectedKeys.length / vaccine.antigens.length) * 100;
}

export function getGameResult(game: VaccineGame): GameResult {
	return { score: game.score, vaccines: game.vaccines, isAllWrong: game.correctCount === 0 };
}
