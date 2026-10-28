import { describe, expect, test } from "bun:test";
import {
	createDeck,
	type GameCard,
	isRoundOver,
	judgePair,
	MATCH_SCORE,
	type PlayState,
	resolveWrong,
	selectCard,
	timeBonus,
} from "@/features/card-game/utils/cardRules";
import { PAIR_COUNTS, type Penalty, type ProductSlot } from "@/types/data";

function product(slot: number, overrides: Partial<ProductSlot> = {}): ProductSlot {
	const image = { ko: `images/product/${slot}-ko.png`, en: `images/product/${slot}-en.png` };
	return { slot, image, isEnabled: true, isShownInResult: true, ...overrides };
}

function products(count: number): ProductSlot[] {
	return Array.from({ length: count }, (_, index) => product(index + 1));
}

const NO_PENALTY: Penalty = {
	time: { isEnabled: false, seconds: 3 },
	score: { isEnabled: false, points: 50 },
};
const TIME_PENALTY: Penalty = { ...NO_PENALTY, time: { isEnabled: true, seconds: 3 } };
const SCORE_PENALTY: Penalty = { ...NO_PENALTY, score: { isEnabled: true, points: 50 } };

function card(id: string, pairId: string, overrides: Partial<GameCard> = {}): GameCard {
	return { id, pairId, image: null, status: "hidden", ...overrides };
}

function playState(overrides: Partial<PlayState> = {}): PlayState {
	return {
		cards: [card("a1", "a"), card("a2", "a"), card("b1", "b"), card("b2", "b")],
		score: 0,
		remainingSeconds: 10,
		...overrides,
	};
}

function statusOf(state: PlayState, id: string) {
	return state.cards.find((candidate) => candidate.id === id)?.status;
}

function pick(state: PlayState, ...ids: string[]): PlayState {
	return ids.reduce((current, id) => selectCard(current, id), state);
}

function judged(state: PlayState, penalty: Penalty, ...ids: string[]): PlayState {
	return judgePair(pick(state, ...ids), penalty);
}

describe("createDeck", () => {
	test.each([...PAIR_COUNTS])("%i쌍이면 쌍마다 2장씩 카드가 만들어진다", (pairCount) => {
		const deck = createDeck(products(14), pairCount);

		expect(deck).toHaveLength(pairCount * 2);
		const pairIds = new Set(deck.map((item) => item.pairId));
		expect(pairIds.size).toBe(pairCount);
		for (const pairId of pairIds) {
			expect(deck.filter((item) => item.pairId === pairId)).toHaveLength(2);
		}
		expect(new Set(deck.map((item) => item.id)).size).toBe(pairCount * 2);
		expect(deck.every((item) => item.status === "hidden")).toBe(true);
	});

	test("꺼진 제품과 사진 없는 제품은 켜진 제품이 충분하면 쓰지 않는다", () => {
		const list = [...products(8), product(9, { isEnabled: false }), product(10, { image: null })];

		const pairIds = new Set(createDeck(list, 8).map((item) => item.pairId));

		expect(pairIds).toEqual(
			new Set(Array.from({ length: 8 }, (_, index) => `product-${index + 1}`)),
		);
	});

	test("켜진 제품이 모자라도 꺼진 제품은 쓰지 않고 자리표시 쌍으로 채운다", () => {
		const list = [
			...products(2),
			product(3, { isEnabled: false }),
			product(4, { isEnabled: false }),
		];

		const deck = createDeck(list, 8);

		expect(deck).toHaveLength(16);
		expect(deck.some((item) => item.pairId === "product-3")).toBe(false);
		expect(deck.some((item) => item.pairId === "product-4")).toBe(false);
		expect(deck.filter((item) => item.image === null)).toHaveLength(12);
	});

	test("사진 없는 켜진 제품도 쓰지 않고 자리표시 쌍으로 채워 pairCount 쌍을 지킨다", () => {
		const deck = createDeck([product(1), product(2, { image: null })], 8);

		expect(deck).toHaveLength(16);
		expect(deck.filter((item) => item.image === null)).toHaveLength(14);
		expect(new Set(deck.map((item) => item.id)).size).toBe(16);
	});

	test("자리표시 카드는 모두 같은 pairId 라 어느 두 장을 골라도 맞는다", () => {
		const deck = createDeck([], 8);
		expect(new Set(deck.map((item) => item.pairId)).size).toBe(1);

		// 서로 다른 자리표시 쌍에서 나온 두 장을 고른다
		const [first, second] = [
			deck.find((item) => item.id.endsWith("-0-a")),
			deck.find((item) => item.id.endsWith("-1-b")),
		];
		if (!first || !second) throw new Error("자리표시 카드를 찾지 못했습니다");
		const state = judged(playState({ cards: deck }), SCORE_PENALTY, first.id, second.id);

		expect(statusOf(state, first.id)).toBe("matched");
		expect(statusOf(state, second.id)).toBe("matched");
		expect(state.score).toBe(MATCH_SCORE);
	});

	test("제품이 하나도 없어도 자리표시 쌍으로 판이 만들어진다", () => {
		const deck = createDeck([], 8);
		expect(deck).toHaveLength(16);
		expect(new Set(deck.map((item) => item.id)).size).toBe(16);
	});

	test("주입한 난수가 같으면 같은 배치가 나온다", () => {
		const sequence = () => {
			let seed = 0.3;
			return () => {
				seed = (seed * 9301 + 0.49297) % 1;
				return seed;
			};
		};

		expect(createDeck(products(10), 8, sequence())).toEqual(
			createDeck(products(10), 8, sequence()),
		);
	});
});

describe("selectCard", () => {
	test("카드는 판정 없이 앞면이 되기만 한다", () => {
		const next = pick(playState(), "a1", "b1");

		expect(statusOf(next, "a1")).toBe("revealed");
		expect(statusOf(next, "b1")).toBe("revealed");
		expect(next.score).toBe(0);
		expect(next.remainingSeconds).toBe(10);
	});

	test("같은 카드를 두 번 눌러도 무시한다", () => {
		const once = pick(playState(), "a1");

		expect(selectCard(once, "a1")).toBe(once);
	});

	test("두 장이 앞면이고 판정 전이면 세 번째 카드는 무시한다", () => {
		const two = pick(playState(), "a1", "b1");

		expect(selectCard(two, "a2")).toBe(two);
	});

	test("맞춘 카드를 다시 눌러도 무시한다", () => {
		const matched = judged(playState(), NO_PENALTY, "a1", "a2");

		expect(selectCard(matched, "a1")).toBe(matched);
	});

	test("오답 되돌림 중에는 다른 카드를 눌러도 무시한다", () => {
		const wrong = judged(playState(), NO_PENALTY, "a1", "b1");

		expect(selectCard(wrong, "a2")).toBe(wrong);
	});

	test("없는 카드 id 는 무시한다", () => {
		const start = playState();

		expect(selectCard(start, "none")).toBe(start);
	});
});

describe("judgePair", () => {
	test("앞면이 두 장이 아니면 판정하지 않는다", () => {
		const one = pick(playState(), "a1");

		expect(judgePair(one, TIME_PENALTY)).toBe(one);
	});

	test("같은 쌍을 맞추면 맞춘 상태로 고정되고 100점을 얻는다", () => {
		const next = judged(playState(), NO_PENALTY, "a1", "a2");

		expect(statusOf(next, "a1")).toBe("matched");
		expect(statusOf(next, "a2")).toBe("matched");
		expect(next.score).toBe(MATCH_SCORE);
	});

	test("패널티가 꺼져 있으면 오답에도 시간과 점수가 그대로다", () => {
		const next = judged(playState({ score: 200 }), NO_PENALTY, "a1", "b1");

		expect(statusOf(next, "a1")).toBe("wrong");
		expect(statusOf(next, "b1")).toBe("wrong");
		expect(next.score).toBe(200);
		expect(next.remainingSeconds).toBe(10);
	});

	test("시간 패널티가 켜져 있으면 남은 시간에서 뺀다", () => {
		const next = judged(playState(), TIME_PENALTY, "a1", "b1");

		expect(next.remainingSeconds).toBe(7);
		expect(next.score).toBe(0);
	});

	test("남은 시간은 0 아래로 내려가지 않는다", () => {
		const next = judged(playState({ remainingSeconds: 2 }), TIME_PENALTY, "a1", "b1");

		expect(next.remainingSeconds).toBe(0);
	});

	test("점수 패널티가 켜져 있으면 점수에서 뺀다", () => {
		const next = judged(playState({ score: 200 }), SCORE_PENALTY, "a1", "b1");

		expect(next.score).toBe(150);
		expect(next.remainingSeconds).toBe(10);
	});

	test("점수는 0 아래로 내려가지 않는다", () => {
		const next = judged(playState({ score: 30 }), SCORE_PENALTY, "a1", "b1");

		expect(next.score).toBe(0);
	});
});

describe("resolveWrong", () => {
	test("wrong 카드만 다시 뒷면으로 돌아가고 맞춘 카드는 유지된다", () => {
		const matched = judged(playState(), NO_PENALTY, "a1", "a2");
		const resolved = resolveWrong(judged(matched, NO_PENALTY, "b1", "b2"));
		const mismatch = resolveWrong(judged(playState(), NO_PENALTY, "a1", "b1"));

		expect(statusOf(resolved, "a1")).toBe("matched");
		expect(statusOf(mismatch, "a1")).toBe("hidden");
		expect(statusOf(mismatch, "b1")).toBe("hidden");
	});
});

describe("isRoundOver", () => {
	test("시간이 남고 맞출 쌍이 남았으면 끝나지 않는다", () => {
		expect(isRoundOver(playState())).toBe(false);
	});

	test("남은 시간이 0 이면 끝난다", () => {
		expect(isRoundOver(playState({ remainingSeconds: 0 }))).toBe(true);
	});

	test("모든 쌍을 맞추면 끝난다", () => {
		const cleared = playState({
			cards: [card("a1", "a", { status: "matched" }), card("a2", "a", { status: "matched" })],
		});

		expect(isRoundOver(cleared)).toBe(true);
	});
});

describe("timeBonus", () => {
	test("남은 시간을 올림한 초 x 100점이다", () => {
		expect(timeBonus(12.3)).toBe(1300);
		expect(timeBonus(5)).toBe(500);
		expect(timeBonus(0.001)).toBe(100);
	});

	test("시간이 없으면 0 이다", () => {
		expect(timeBonus(0)).toBe(0);
		expect(timeBonus(-1)).toBe(0);
	});
});
