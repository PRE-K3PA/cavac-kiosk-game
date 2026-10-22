import {
	createGame,
	getCurrentVaccine,
	getNeededAntigens,
	isGameOver,
	tapAntigen,
	tickGame,
	type VaccineGame,
} from "@/features/vaccine-game/utils/game";
import {
	createFallingAntigen,
	type FallingAntigen,
	type FallingField,
	getDistractors,
	getFallSpeed,
	pickSpawnAntigen,
	pickSpawnX,
	shouldSpawn,
	stepFalling,
} from "@/features/vaccine-game/utils/spawn";
import type { Antigen, Vaccine, VaccineGameSettings } from "@/types/data";

export const CORRECT_VISIBLE_MS = 450;
export const FEEDBACK_VISIBLE_MS = 1500;
/** 완성한 순간 병이 가득 찬 모습을 잠깐 보여 준 뒤 다음 백신으로 비운다 */
export const FULL_BOTTLE_VISIBLE_MS = 700;

export type PlayFeedback = {
	/** 오답 안내에 보여 줄, 아직 모으지 않은 항원 */
	missing: Antigen;
	shownAtMs: number;
};

/** 마지막 터치에서 일어난 일. 화면은 seq 가 바뀔 때 애니메이션을 튼다 */
export type TapEvent = {
	seq: number;
	outcome: "correct" | "wrong";
	scoreDelta: number;
	combo: number;
	isVaccineCompleted: boolean;
	x: number;
	y: number;
};

export type PlayState = {
	game: VaccineGame;
	falling: FallingAntigen[];
	nextId: number;
	msSinceSpawn: number;
	fallSpeed: number;
	maxOnScreen: number;
	feedback: PlayFeedback | null;
	lastTap: TapEvent | null;
	/** 마지막으로 백신을 완성한 시점(게임 경과 ms) */
	completedAtMs: number | null;
};

export type PlayOptions = {
	/** 오답 항원을 이번 판에서 못 찾을 때 고르는 전체 백신 */
	allVaccines: Vaccine[];
	field: FallingField;
	random: () => number;
};

export function createPlay(
	round: Vaccine[],
	settings: VaccineGameSettings,
	playDurationSeconds: number,
): PlayState {
	return {
		game: createGame(round, settings, playDurationSeconds),
		falling: [],
		nextId: 1,
		msSinceSpawn: Number.POSITIVE_INFINITY,
		fallSpeed: getFallSpeed(settings.fallSpeedPercent),
		maxOnScreen: settings.maxAntigensOnScreen,
		feedback: null,
		lastTap: null,
		completedAtMs: null,
	};
}

export function isBottleFull(state: PlayState): boolean {
	return (
		state.completedAtMs !== null &&
		state.game.elapsedMs - state.completedAtMs < FULL_BOTTLE_VISIBLE_MS
	);
}

function isCorrectExpired(item: FallingAntigen, elapsedMs: number): boolean {
	return (
		item.judgement === "correct" && elapsedMs - (item.judgedAtMs ?? elapsedMs) >= CORRECT_VISIBLE_MS
	);
}

function spawn(state: PlayState, options: PlayOptions): PlayState {
	if (!shouldSpawn(state.falling, state.maxOnScreen, state.msSinceSpawn)) return state;

	const current = getCurrentVaccine(state.game);
	if (!current) return state;
	const distractors = getDistractors(current, state.game.vaccines, options.allVaccines);
	const antigen = pickSpawnAntigen(
		getNeededAntigens(state.game),
		distractors,
		state.falling,
		options.random,
	);
	const x = pickSpawnX(state.falling, options.field, options.random);
	if (!antigen || x === null) return state;

	return {
		...state,
		falling: [...state.falling, createFallingAntigen(state.nextId, antigen, x)],
		nextId: state.nextId + 1,
		msSinceSpawn: 0,
	};
}

export function advancePlay(state: PlayState, deltaMs: number, options: PlayOptions): PlayState {
	if (isGameOver(state.game)) return state;

	const game = tickGame(state.game, deltaMs);
	// y 는 구슬 아래 끝이라, 구슬 전체가 바닥 밑으로 빠진 뒤에 지운다
	const falling = stepFalling(
		state.falling,
		deltaMs,
		state.fallSpeed,
		options.field.height + options.field.ballSize,
	).filter((item) => !isCorrectExpired(item, game.elapsedMs));
	const feedback =
		state.feedback && game.elapsedMs - state.feedback.shownAtMs < FEEDBACK_VISIBLE_MS
			? state.feedback
			: null;

	return spawn(
		{ ...state, game, falling, feedback, msSinceSpawn: state.msSinceSpawn + deltaMs },
		options,
	);
}

export function tapFalling(state: PlayState, id: number): PlayState {
	const target = state.falling.find((item) => item.id === id);
	if (!target || target.judgement) return state;

	const { game, outcome } = tapAntigen(state.game, target.antigen);
	if (outcome === "ignored") return state;

	const judged: FallingAntigen = { ...target, judgement: outcome, judgedAtMs: game.elapsedMs };
	const [missing] = getNeededAntigens(game);
	const isVaccineCompleted = game.completedCount > state.game.completedCount;
	return {
		...state,
		game,
		falling: state.falling.map((item) => (item.id === id ? judged : item)),
		feedback:
			outcome === "wrong" && missing ? { missing, shownAtMs: game.elapsedMs } : state.feedback,
		lastTap: {
			seq: (state.lastTap?.seq ?? 0) + 1,
			outcome,
			scoreDelta: game.score - state.game.score,
			combo: game.combo,
			isVaccineCompleted,
			x: target.x,
			y: target.y,
		},
		completedAtMs: isVaccineCompleted ? game.elapsedMs : state.completedAtMs,
	};
}
