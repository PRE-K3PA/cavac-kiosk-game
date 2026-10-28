import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useCardGame } from "@/features/card-game/hooks/useCardGame";
import {
	CARD_FLIP_MS,
	type GameCard,
	PREVIEW_COUNTDOWN_SECONDS,
} from "@/features/card-game/utils/cardRules";
import type { CardGameData, Penalty } from "@/types/data";

const PREVIEW_MS = PREVIEW_COUNTDOWN_SECONDS[8] * 1000;

const TIME_PENALTY: Penalty = {
	time: { isEnabled: true, seconds: 3 },
	score: { isEnabled: false, points: 50 },
};

function gameData(penalty: Penalty = TIME_PENALTY): CardGameData {
	return {
		settings: { pairCount: 8, penalty },
		products: Array.from({ length: 8 }, (_, index) => ({
			slot: index + 1,
			image: { ko: `images/product/${index + 1}.png`, en: `images/product/${index + 1}.png` },
			isEnabled: true,
			isShownInResult: index !== 3,
		})),
	};
}

type GameView = ReturnType<typeof renderGame>;

function renderGame(duration = 10, data = gameData()) {
	return renderHook(() => useCardGame(data, duration));
}

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	cleanup();
	jest.useRealTimers();
});

function advance(ms: number) {
	act(() => {
		jest.advanceTimersByTime(ms);
	});
}

function startPlaying(view: GameView) {
	advance(PREVIEW_MS);
	expect(view.result.current.phase).toBe("flipping");
	advance(CARD_FLIP_MS);
	expect(view.result.current.phase).toBe("playing");
}

function click(view: GameView, cardId: string) {
	act(() => view.result.current.onCardClick(cardId));
}

function cardsOf(view: GameView): GameCard[] {
	return view.result.current.cards;
}

function otherPairCard(cards: GameCard[], first: GameCard): GameCard {
	return cards.find((card) => card.pairId !== first.pairId) as GameCard;
}

function mismatch(view: GameView) {
	const [first] = cardsOf(view);
	click(view, first.id);
	click(view, otherPairCard(cardsOf(view), first).id);
	advance(CARD_FLIP_MS);
}

function matchPair(view: GameView) {
	const first = cardsOf(view).find((card) => card.status === "hidden") as GameCard;
	click(view, first.id);
	const partner = cardsOf(view).find(
		(card) => card.pairId === first.pairId && card.id !== first.id,
	) as GameCard;
	click(view, partner.id);
	advance(CARD_FLIP_MS);
}

describe("useCardGame", () => {
	test("시작 전에는 모든 카드를 앞면으로 보여 주며 5, 4, 3, 2, 1 을 센다", () => {
		const view = renderGame();

		expect(view.result.current.phase).toBe("preview");
		expect(view.result.current.countdown).toBe(5);
		expect(cardsOf(view)).toHaveLength(16);
		expect(cardsOf(view).every((card) => card.status === "revealed")).toBe(true);

		for (const countdown of [4, 3, 2, 1]) {
			advance(1000);
			expect(view.result.current.countdown).toBe(countdown);
		}
	});

	test.each([
		[6, 3],
		[8, 5],
		[10, 7],
	] as const)("%i쌍이면 %i초 동안 보여 준 뒤 뒤집는다", (pairCount, seconds) => {
		const data = gameData();
		const view = renderGame(10, { ...data, settings: { ...data.settings, pairCount } });

		expect(view.result.current.countdown).toBe(seconds);
		advance(seconds * 1000 - 1);
		expect(view.result.current.phase).toBe("preview");
		advance(1);
		expect(view.result.current.phase).toBe("flipping");
	});

	test("카운트다운이 끝나면 카드가 모두 뒤집히고 플레이가 시작된다", () => {
		const view = renderGame();
		startPlaying(view);

		expect(view.result.current.countdown).toBe(0);
		expect(cardsOf(view).every((card) => card.status === "hidden")).toBe(true);
		expect(view.result.current.progress).toBe(1);
	});

	test("카운트다운이 끝나면 먼저 뒤집힘 단계가 되어 타이머가 멈추고 입력을 무시한다", () => {
		const view = renderGame();
		advance(PREVIEW_MS);

		expect(view.result.current.phase).toBe("flipping");
		expect(view.result.current.countdown).toBe(0);
		expect(cardsOf(view).every((card) => card.status === "hidden")).toBe(true);

		click(view, cardsOf(view)[0].id);
		advance(CARD_FLIP_MS - 100);
		expect(view.result.current.phase).toBe("flipping");
		expect(view.result.current.remainingSeconds).toBe(10);
		expect(cardsOf(view).every((card) => card.status === "hidden")).toBe(true);

		advance(100);
		expect(view.result.current.phase).toBe("playing");
		advance(1000);
		expect(view.result.current.remainingSeconds).toBeCloseTo(9, 1);
	});

	test("두 장을 누르면 뒤집힘이 끝난 뒤에야 판정한다", () => {
		const view = renderGame();
		startPlaying(view);
		const [first] = cardsOf(view);
		click(view, first.id);
		click(view, otherPairCard(cardsOf(view), first).id);

		advance(CARD_FLIP_MS - 1);
		expect(cardsOf(view).filter((card) => card.status === "revealed")).toHaveLength(2);
		expect(view.result.current.remainingSeconds).toBeGreaterThan(6.9);

		advance(1);
		expect(cardsOf(view).filter((card) => card.status === "wrong")).toHaveLength(2);
		expect(view.result.current.remainingSeconds).toBeLessThan(7);
	});

	test("맞춘 쌍도 뒤집힘이 끝난 뒤에 matched 가 되고 점수가 오른다", () => {
		const view = renderGame();
		startPlaying(view);
		const first = cardsOf(view)[0];
		const partner = cardsOf(view).find(
			(card) => card.pairId === first.pairId && card.id !== first.id,
		) as GameCard;
		click(view, first.id);
		click(view, partner.id);

		advance(CARD_FLIP_MS - 1);
		expect(view.result.current.score).toBe(0);
		advance(1);
		expect(view.result.current.score).toBe(100);
		expect(view.result.current.matchedPairs).toBe(1);
	});

	test("판정 전에 세 번째 카드를 눌러도 무시한다", () => {
		const view = renderGame();
		startPlaying(view);
		const [first] = cardsOf(view);
		click(view, first.id);
		click(view, otherPairCard(cardsOf(view), first).id);
		const third = cardsOf(view).find((card) => card.status === "hidden") as GameCard;
		click(view, third.id);

		expect(cardsOf(view).find((card) => card.id === third.id)?.status).toBe("hidden");
	});

	test("오답은 판정 뒤 0.5초가 지나야 다시 뒤집힌다", () => {
		const view = renderGame();
		startPlaying(view);
		mismatch(view);
		advance(499);
		expect(cardsOf(view).filter((card) => card.status === "wrong")).toHaveLength(2);
		advance(1);
		expect(cardsOf(view).every((card) => card.status === "hidden")).toBe(true);
	});

	test("preview 중 카드 입력은 무시한다", () => {
		const view = renderGame();
		click(view, cardsOf(view)[0].id);
		startPlaying(view);

		expect(cardsOf(view).every((card) => card.status === "hidden")).toBe(true);
	});

	test("같은 쌍을 맞추면 100점과 맞춘 쌍 수가 오른다", () => {
		const view = renderGame();
		startPlaying(view);
		matchPair(view);

		expect(view.result.current.score).toBe(100);
		expect(view.result.current.matchedPairs).toBe(1);
	});

	test("오답은 0.5초 동안 wrong 으로 보이고 그동안 입력을 무시한 뒤 뒤집힌다", () => {
		const view = renderGame();
		startPlaying(view);
		mismatch(view);

		expect(cardsOf(view).filter((card) => card.status === "wrong")).toHaveLength(2);
		expect(view.result.current.remainingSeconds).toBeCloseTo(10 - 0.4 - 3, 5);

		const third = cardsOf(view).find((card) => card.status === "hidden") as GameCard;
		click(view, third.id);
		expect(cardsOf(view).find((card) => card.id === third.id)?.status).toBe("hidden");

		advance(500);
		expect(cardsOf(view).every((card) => card.status === "hidden")).toBe(true);
	});

	test("시간 패널티가 꺼져 있으면 오답에도 남은 시간이 그대로다", () => {
		const off: Penalty = { ...TIME_PENALTY, time: { isEnabled: false, seconds: 3 } };
		const view = renderGame(10, gameData(off));
		startPlaying(view);
		mismatch(view);

		expect(view.result.current.remainingSeconds).toBeCloseTo(10 - 0.4, 5);
	});

	test("같은 카드를 두 번 눌러도 패널티 없이 무시한다", () => {
		const view = renderGame();
		startPlaying(view);
		const [first] = cardsOf(view);
		click(view, first.id);
		click(view, first.id);

		expect(cardsOf(view).filter((card) => card.status === "revealed")).toHaveLength(1);
		expect(view.result.current.remainingSeconds).toBe(10);
	});

	test("맞춘 카드를 다시 눌러도 점수는 그대로다", () => {
		const view = renderGame();
		startPlaying(view);
		matchPair(view);
		click(view, (cardsOf(view).find((card) => card.status === "matched") as GameCard).id);

		expect(view.result.current.score).toBe(100);
		expect(cardsOf(view).filter((card) => card.status === "matched")).toHaveLength(2);
	});

	test("시간이 지나면 남은 시간이 줄고 0 이 되면 판이 끝난다", () => {
		const view = renderGame(10);
		startPlaying(view);
		advance(5000);

		expect(view.result.current.remainingSeconds).toBeCloseTo(5, 1);
		expect(view.result.current.progress).toBeCloseTo(0.5, 1);

		advance(5000);
		expect(view.result.current.phase).toBe("finished");
		expect(view.result.current.remainingSeconds).toBe(0);
		expect(view.result.current.score).toBe(0);
	});

	test("시간 패널티로 남은 시간이 0 이 되면 판이 끝난다", () => {
		const view = renderGame(2);
		startPlaying(view);
		mismatch(view);

		expect(view.result.current.phase).toBe("finished");
		expect(view.result.current.remainingSeconds).toBe(0);
	});

	test("모든 쌍을 맞추면 시간이 남아도 판이 끝난다", () => {
		const view = renderGame(60);
		startPlaying(view);
		for (let pair = 0; pair < 8; pair += 1) matchPair(view);

		expect(view.result.current.phase).toBe("finished");
		expect(view.result.current.matchedPairs).toBe(8);
		const { score, remainingSeconds } = view.result.current;
		expect(remainingSeconds).toBeGreaterThan(0);
		// 8쌍 x 100점 + 남은 시간 올림 초 x 100점
		expect(score).toBe(800 + Math.ceil(remainingSeconds) * 100);
		expect(score).toBeGreaterThan(800);
	});

	test("판이 끝난 뒤 입력과 시간 흐름은 무시한다", () => {
		const view = renderGame(1);
		startPlaying(view);
		advance(1000);
		expect(view.result.current.phase).toBe("finished");
		const finishedCards = cardsOf(view);

		click(view, finishedCards[0].id);
		advance(5000);

		expect(cardsOf(view)).toEqual(finishedCards);
		expect(view.result.current.score).toBe(0);
		expect(view.result.current.remainingSeconds).toBe(0);
	});

	test("결과 제품은 켜져 있고 결과 표시가 켜진 사진 제품만 슬롯 순서로 담는다", () => {
		const view = renderGame();

		expect(view.result.current.resultProducts.map((image) => image.ko)).toEqual(
			[1, 2, 3, 5, 6, 7, 8].map((slot) => `images/product/${slot}.png`),
		);
	});

	test("판정 대기 중 시간이 0 이 되면 끝나고 그 판정은 적용되지 않는다", () => {
		const view = renderGame(0.3);
		startPlaying(view);
		const [first] = cardsOf(view);
		click(view, first.id);
		click(view, otherPairCard(cardsOf(view), first).id);
		advance(300);

		expect(view.result.current.phase).toBe("finished");
		advance(CARD_FLIP_MS);
		expect(cardsOf(view).filter((card) => card.status === "revealed")).toHaveLength(2);
		expect(cardsOf(view).some((card) => card.status === "wrong")).toBe(false);
		expect(view.result.current.score).toBe(0);
		expect(jest.getTimerCount()).toBe(0);
	});

	test("오답이 보이는 동안 시간이 0 이 되면 끝나고 타이머가 남지 않는다", () => {
		const off: Penalty = { ...TIME_PENALTY, time: { isEnabled: false, seconds: 3 } };
		const view = renderGame(0.8, gameData(off));
		startPlaying(view);
		mismatch(view);
		expect(cardsOf(view).filter((card) => card.status === "wrong")).toHaveLength(2);

		advance(400);

		expect(view.result.current.phase).toBe("finished");
		expect(jest.getTimerCount()).toBe(0);
	});

	test("언마운트하면 타이머가 모두 정리된다", () => {
		const view = renderGame();
		startPlaying(view);
		mismatch(view);
		view.unmount();
		expect(jest.getTimerCount()).toBe(0);
	});

	test("뒤집힘 단계나 판정 대기 중 언마운트해도 타이머가 남지 않는다", () => {
		const flipping = renderGame();
		advance(PREVIEW_MS);
		flipping.unmount();
		expect(jest.getTimerCount()).toBe(0);

		const pending = renderGame();
		startPlaying(pending);
		const [first] = cardsOf(pending);
		click(pending, first.id);
		click(pending, otherPairCard(cardsOf(pending), first).id);
		pending.unmount();

		expect(jest.getTimerCount()).toBe(0);
	});
});
