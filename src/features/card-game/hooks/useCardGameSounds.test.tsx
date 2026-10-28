import { afterEach, beforeEach, describe, expect, jest, spyOn, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useCardGame } from "@/features/card-game/hooks/useCardGame";
import { useCardGameSounds } from "@/features/card-game/hooks/useCardGameSounds";
import { CARD_FLIP_MS, type GameCard, WRONG_REVEAL_MS } from "@/features/card-game/utils/cardRules";
import { useSessionStore } from "@/store/sessionStore";
import type { CardGameData } from "@/types/data";
import * as engine from "@/utils/soundEngine";

const PLAY_SECONDS = 12;

const DATA: CardGameData = {
	settings: {
		pairCount: 8,
		penalty: {
			time: { isEnabled: false, seconds: 3 },
			score: { isEnabled: false, points: 50 },
		},
	},
	products: Array.from({ length: 8 }, (_, index) => ({
		slot: index + 1,
		image: { ko: `images/${index + 1}.png`, en: `images/${index + 1}.png` },
		isEnabled: true,
		isShownInResult: true,
	})),
};

let played: engine.SoundName[] = [];
let playSpy: ReturnType<typeof spyOn<typeof engine, "playSound">>;
let started: engine.SoundName[] = [];
let stopped: engine.SoundName[] = [];
let startSpy: ReturnType<typeof spyOn<typeof engine, "startSound">>;

function renderGame() {
	return renderHook(() => {
		const game = useCardGame(DATA, PLAY_SECONDS);
		useCardGameSounds(game);
		return game;
	});
}

type View = ReturnType<typeof renderGame>;

beforeEach(() => {
	jest.useFakeTimers();
	played = [];
	playSpy = spyOn(engine, "playSound").mockImplementation((name) => {
		played.push(name);
	});
	started = [];
	stopped = [];
	startSpy = spyOn(engine, "startSound").mockImplementation((name) => {
		started.push(name);
		return () => stopped.push(name);
	});
});

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	playSpy.mockRestore();
	startSpy.mockRestore();
	useSessionStore.getState().reset();
});

function advance(ms: number) {
	act(() => {
		jest.advanceTimersByTime(ms);
	});
}

function startPlaying() {
	advance(3000);
	advance(CARD_FLIP_MS);
	played = [];
}

function click(view: View, card: GameCard) {
	act(() => view.result.current.onCardClick(card.id));
}

function pair(view: View, isMatch: boolean): [GameCard, GameCard] {
	const [first] = view.result.current.cards;
	const second = view.result.current.cards.find((card) =>
		isMatch ? card.pairId === first.pairId && card.id !== first.id : card.pairId !== first.pairId,
	) as GameCard;
	return [first, second];
}

describe("useCardGameSounds", () => {
	test("안내가 시작되면 countdown 을 한 번 틀고, 카드가 모두 뒤집힐 때 멈추며 pop 이 한 번 난다", () => {
		renderGame();
		expect(started).toEqual(["countdown"]);

		advance(2000);
		expect(played).toEqual([]);
		expect(stopped).toEqual([]);

		advance(1000);
		expect(played).toEqual(["pop"]);
		expect(started).toEqual(["countdown"]);
		expect(stopped).toEqual(["countdown"]);
	});

	test("안내 중에 화면을 떠나면 countdown 을 멈춘다", () => {
		const view = renderGame();
		view.unmount();

		expect(stopped).toEqual(["countdown"]);
	});

	test("카드를 누르면 pop, 맞으면 400ms 뒤 match", () => {
		const view = renderGame();
		startPlaying();
		const [first, second] = pair(view, true);

		click(view, first);
		expect(played).toEqual(["pop"]);
		click(view, second);
		expect(played).toEqual(["pop", "pop"]);

		advance(CARD_FLIP_MS);
		expect(played).toEqual(["pop", "pop", "match"]);
	});

	test("오답은 wrong, 되돌아갈 때 pop 이 한 번 난다(두 장이 바뀌어도)", () => {
		const view = renderGame();
		startPlaying();
		const [first, second] = pair(view, false);
		click(view, first);
		click(view, second);
		played = [];

		advance(CARD_FLIP_MS);
		expect(played).toEqual(["wrong"]);

		advance(WRONG_REVEAL_MS);
		expect(played).toEqual(["wrong", "pop"]);
	});

	test("플레이 중 1초마다 tick, 총 시간의 1/6 이하에서는 tickUrgent", () => {
		renderGame();
		startPlaying();

		advance(1000);
		expect(played.filter((name) => name === "tick")).toHaveLength(1);

		advance(9000);
		const urgentStart = played.indexOf("tickUrgent");
		expect(urgentStart).toBeGreaterThan(0);
		expect(played.slice(0, urgentStart).every((name) => name === "tick")).toBe(true);
		expect(played.slice(urgentStart).every((name) => name === "tickUrgent")).toBe(true);
	});

	test("끝나면 fanfare 가 한 번 나고 그 뒤로는 소리가 없다", () => {
		renderGame();
		startPlaying();
		advance(PLAY_SECONDS * 1000 + 500);

		expect(played.filter((name) => name === "fanfare")).toHaveLength(1);
		expect(played.at(-1)).toBe("fanfare");

		played = [];
		advance(5000);
		expect(played).toEqual([]);
	});

	test("음소거면 소리가 나지 않는다", () => {
		useSessionStore.getState().toggleMute();
		const view = renderGame();
		advance(3000);
		advance(CARD_FLIP_MS);
		const [first, second] = pair(view, true);
		click(view, first);
		click(view, second);
		advance(PLAY_SECONDS * 1000);

		expect(played).toEqual([]);
		expect(started).toEqual([]);
	});

	test("언마운트하면 이후 소리가 나지 않는다", () => {
		const view = renderGame();
		startPlaying();
		view.unmount();
		advance(PLAY_SECONDS * 1000);

		expect(played).toEqual([]);
	});
});
