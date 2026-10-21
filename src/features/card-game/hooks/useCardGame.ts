import { useEffect, useReducer } from "react";
import {
	type CardGamePhase,
	cardGameReducer,
	createInitialState,
} from "@/features/card-game/utils/cardGameReducer";
import {
	CARD_FLIP_MS,
	countMatchedPairs,
	type GameCard,
	hasPendingJudge,
	hasWrongCards,
	WRONG_REVEAL_MS,
} from "@/features/card-game/utils/cardRules";
import type { CardGameData, ImagePath, Localized } from "@/types/data";

export type { CardGamePhase };

export type CardGameView = {
	phase: CardGamePhase;
	countdown: number;
	cards: GameCard[];
	score: number;
	matchedPairs: number;
	remainingSeconds: number;
	progress: number;
	resultProducts: Localized<ImagePath>[];
	onCardClick: (cardId: string) => void;
};

const TICK_MS = 100;
const COUNTDOWN_TICK_MS = 1000;

function getResultProducts({ products }: CardGameData): Localized<ImagePath>[] {
	const shown: Localized<ImagePath>[] = [];
	for (const { image, isEnabled, isShownInResult } of products) {
		if (isEnabled && isShownInResult && image !== null) shown.push(image);
	}
	return shown;
}

// 게임 진행 상태는 이 훅 안에만 둡니다. 화면이 사라지면 점수도 함께 사라집니다
export function useCardGame(data: CardGameData, playDurationSeconds: number): CardGameView {
	const [state, dispatch] = useReducer(cardGameReducer, undefined, () =>
		createInitialState(data, playDurationSeconds),
	);
	const { phase, cards } = state;
	const hasWrong = hasWrongCards(cards);
	const isJudgePending = hasPendingJudge(cards);

	useEffect(() => {
		if (phase !== "preview") return;
		const timer = setInterval(() => dispatch({ type: "previewTick" }), COUNTDOWN_TICK_MS);
		return () => clearInterval(timer);
	}, [phase]);

	useEffect(() => {
		if (phase !== "flipping") return;
		const timer = setTimeout(() => dispatch({ type: "flipEnd" }), CARD_FLIP_MS);
		return () => clearTimeout(timer);
	}, [phase]);

	useEffect(() => {
		if (phase !== "playing") return;
		let lastTickAt = Date.now();
		const timer = setInterval(() => {
			const now = Date.now();
			dispatch({ type: "tick", elapsedSeconds: (now - lastTickAt) / 1000 });
			lastTickAt = now;
		}, TICK_MS);
		return () => clearInterval(timer);
	}, [phase]);

	useEffect(() => {
		if (!isJudgePending || phase !== "playing") return;
		const timer = setTimeout(
			() => dispatch({ type: "judge", penalty: data.settings.penalty }),
			CARD_FLIP_MS,
		);
		return () => clearTimeout(timer);
	}, [isJudgePending, phase, data.settings.penalty]);

	useEffect(() => {
		if (!hasWrong || phase !== "playing") return;
		const timer = setTimeout(() => dispatch({ type: "resolveWrong" }), WRONG_REVEAL_MS);
		return () => clearTimeout(timer);
	}, [hasWrong, phase]);

	const progress =
		playDurationSeconds > 0 ? Math.min(1, state.remainingSeconds / playDurationSeconds) : 0;

	return {
		phase,
		countdown: state.countdown,
		cards: phase === "preview" ? cards.map((card) => ({ ...card, status: "revealed" })) : cards,
		score: state.score,
		matchedPairs: countMatchedPairs(cards),
		remainingSeconds: state.remainingSeconds,
		progress,
		resultProducts: getResultProducts(data),
		onCardClick: (cardId) => dispatch({ type: "select", cardId }),
	};
}
