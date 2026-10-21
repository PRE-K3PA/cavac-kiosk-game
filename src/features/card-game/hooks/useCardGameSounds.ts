import { useEffect, useRef } from "react";
import { WARNING_RATIO } from "@/components/common/PlayTimer";
import type { CardGameView } from "@/features/card-game/hooks/useCardGame";
import type { GameCard } from "@/features/card-game/utils/cardRules";
import { useSound } from "@/hooks/useSound";
import { SOUND_NAMES, type SoundName } from "@/utils/soundEngine";

function statusById(cards: GameCard[]): Map<string, GameCard["status"]> {
	return new Map(cards.map((card) => [card.id, card.status]));
}

// 카드가 앞면이 되거나 오답이 되돌아가는 순간. 몇 장이 바뀌어도 한 번만 셉니다
function isCardFlipped(before: CardGameView, after: CardGameView): boolean {
	if (before.phase === "preview" && after.phase === "flipping") return true;
	const previous = statusById(before.cards);
	return after.cards.some((card) => {
		const was = previous.get(card.id);
		return (
			(was === "hidden" && card.status === "revealed") ||
			(was === "wrong" && card.status === "hidden")
		);
	});
}

function hasWrong(view: CardGameView): boolean {
	return view.cards.some((card) => card.status === "wrong");
}

// 안내 숫자가 바뀔 때. 마지막 1 → 0 은 카드가 뒤집히는 pop 이 대신합니다
function isCountingDown(before: CardGameView, after: CardGameView): boolean {
	return (
		before.phase === "preview" && after.phase === "preview" && after.countdown !== before.countdown
	);
}

function isTicking(before: CardGameView, after: CardGameView): boolean {
	return (
		before.phase === "playing" &&
		after.phase === "playing" &&
		Math.ceil(after.remainingSeconds) !== Math.ceil(before.remainingSeconds)
	);
}

/** 두 상태 사이에서 낼 소리를 순서대로 돌려줍니다 */
export function getCardGameSounds(before: CardGameView, after: CardGameView): SoundName[] {
	const sounds: SoundName[] = [];
	if (isCardFlipped(before, after)) sounds.push(SOUND_NAMES.pop);
	if (after.matchedPairs > before.matchedPairs) sounds.push(SOUND_NAMES.match);
	if (!hasWrong(before) && hasWrong(after)) sounds.push(SOUND_NAMES.wrong);
	if (isCountingDown(before, after)) sounds.push(SOUND_NAMES.tick);
	if (isTicking(before, after)) {
		sounds.push(after.progress <= WARNING_RATIO ? SOUND_NAMES.tickUrgent : SOUND_NAMES.tick);
	}
	if (before.phase !== "finished" && after.phase === "finished") sounds.push(SOUND_NAMES.fanfare);
	return sounds;
}

export function useCardGameSounds(game: CardGameView) {
	const play = useSound();
	const previous = useRef(game);

	useEffect(() => {
		const before = previous.current;
		previous.current = game;
		for (const sound of getCardGameSounds(before, game)) play(sound);
	}, [game, play]);
}
