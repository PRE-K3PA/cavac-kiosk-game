import {
	createDeck,
	isRoundOver,
	judgePair,
	type PlayState,
	PREVIEW_COUNTDOWN_SECONDS,
	resolveWrong,
	selectCard,
	timeBonus,
} from "@/features/card-game/utils/cardRules";
import type { CardGameData, Penalty } from "@/types/data";

export type CardGamePhase = "preview" | "flipping" | "playing" | "finished";

export type CardGameState = PlayState & {
	phase: CardGamePhase;
	countdown: number;
};

export type CardGameAction =
	| { type: "previewTick" }
	| { type: "tick"; elapsedSeconds: number }
	| { type: "flipEnd" }
	| { type: "select"; cardId: string }
	| { type: "judge"; penalty: Penalty }
	| { type: "resolveWrong" };

export function createInitialState(
	{ settings, products }: CardGameData,
	playDurationSeconds: number,
): CardGameState {
	return {
		phase: "preview",
		countdown: PREVIEW_COUNTDOWN_SECONDS[settings.pairCount],
		cards: createDeck(products, settings.pairCount),
		score: 0,
		remainingSeconds: playDurationSeconds,
	};
}

// 부동소수 오차가 쌓여 0 에 못 닿는 일이 없게 밀리초로 반올림합니다
function subtractSeconds(remainingSeconds: number, elapsedSeconds: number): number {
	return Math.max(0, Math.round((remainingSeconds - elapsedSeconds) * 1000) / 1000);
}

function finishIfOver(state: CardGameState): CardGameState {
	if (!isRoundOver(state)) return state;
	// playing 에서만 불리므로 finished 로 넘어가는 이 한 번만 보너스가 더해집니다
	return { ...state, phase: "finished", score: state.score + timeBonus(state.remainingSeconds) };
}

export function cardGameReducer(state: CardGameState, action: CardGameAction): CardGameState {
	if (action.type === "previewTick") {
		if (state.phase !== "preview") return state;
		const countdown = state.countdown - 1;
		return countdown > 0 ? { ...state, countdown } : { ...state, countdown: 0, phase: "flipping" };
	}
	if (action.type === "flipEnd") {
		return state.phase === "flipping" ? { ...state, phase: "playing" } : state;
	}
	if (state.phase !== "playing") return state;

	switch (action.type) {
		case "tick":
			return finishIfOver({
				...state,
				remainingSeconds: subtractSeconds(state.remainingSeconds, action.elapsedSeconds),
			});
		case "select":
			return { ...state, ...selectCard(state, action.cardId) };
		case "judge":
			return finishIfOver({ ...state, ...judgePair(state, action.penalty) });
		case "resolveWrong":
			return { ...state, ...resolveWrong(state) };
	}
}
