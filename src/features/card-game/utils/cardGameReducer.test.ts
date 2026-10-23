import { describe, expect, test } from "bun:test";
import { type CardGameState, cardGameReducer } from "@/features/card-game/utils/cardGameReducer";
import type { GameCard } from "@/features/card-game/utils/cardRules";
import type { Penalty } from "@/types/data";

const NO_PENALTY: Penalty = {
	time: { isEnabled: false, seconds: 3 },
	score: { isEnabled: false, points: 50 },
};
const SCORE_PENALTY: Penalty = { ...NO_PENALTY, score: { isEnabled: true, points: 500 } };

function card(id: string, pairId: string, status: GameCard["status"]): GameCard {
	return { id, pairId, image: null, status };
}

// a 쌍은 이미 맞췄고, b 쌍의 두 장이 앞면이라 판정만 남은 상태
function lastPairState(remainingSeconds: number, score = 100): CardGameState {
	return {
		phase: "playing",
		countdown: 0,
		cards: [
			card("a1", "a", "matched"),
			card("a2", "a", "matched"),
			card("b1", "b", "revealed"),
			card("b2", "b", "revealed"),
		],
		score,
		remainingSeconds,
	};
}

function judge(state: CardGameState, penalty: Penalty = NO_PENALTY) {
	return cardGameReducer(state, { type: "judge", penalty });
}

describe("시간 보너스", () => {
	test("마지막 쌍을 맞추면 쌍 점수에 남은 시간 올림 초 x 100 이 더해진다", () => {
		const done = judge(lastPairState(12.3));

		expect(done.phase).toBe("finished");
		expect(done.score).toBe(100 + 100 + 1300);
	});

	test("정확히 5.0초 남았으면 500점이다", () => {
		expect(judge(lastPairState(5, 0)).score).toBe(100 + 500);
	});

	test("남은 시간이 0 이면 보너스가 없다", () => {
		expect(judge(lastPairState(0, 0)).score).toBe(100);
	});

	test("시간이 다 되어 끝나면 보너스가 없다", () => {
		const state = { ...lastPairState(0.05, 300), cards: lastPairState(1).cards };
		const over = cardGameReducer(state, { type: "tick", elapsedSeconds: 1 });

		expect(over.phase).toBe("finished");
		expect(over.score).toBe(300);
	});

	test("시간 패널티로 0 이 되어 끝나면 보너스가 없다", () => {
		const timePenalty: Penalty = { ...NO_PENALTY, time: { isEnabled: true, seconds: 3 } };
		const state: CardGameState = {
			...lastPairState(2, 100),
			cards: [card("a1", "a", "revealed"), card("b1", "b", "revealed"), card("a2", "a", "hidden")],
		};
		const over = judge(state, timePenalty);

		expect(over.phase).toBe("finished");
		expect(over.score).toBe(100);
	});

	test("이미 끝난 판에서는 입력이나 판정이 와도 보너스가 다시 더해지지 않는다", () => {
		const done = judge(lastPairState(12.3));

		expect(judge(done)).toBe(done);
		expect(cardGameReducer(done, { type: "select", cardId: "a1" })).toBe(done);
		expect(cardGameReducer(done, { type: "tick", elapsedSeconds: 1 })).toBe(done);
	});

	test("점수 패널티의 하한 0 을 적용한 뒤에 보너스를 더한다", () => {
		const state: CardGameState = {
			...lastPairState(3, 100),
			cards: [
				card("a1", "a", "matched"),
				card("a2", "a", "matched"),
				card("b1", "b", "revealed"),
				card("c1", "c", "revealed"),
				card("b2", "b", "hidden"),
				card("c2", "c", "hidden"),
			],
		};
		// 오답이라 끝나지 않으므로 보너스 없이 하한 0 만 적용된다
		const wrong = judge(state, SCORE_PENALTY);
		expect(wrong.phase).toBe("playing");
		expect(wrong.score).toBe(0);

		// 시간이 막 0 이 되는 오답: 하한 0 이 먼저, 보너스는 0
		const lastSecond = judge(
			{ ...state, remainingSeconds: 3 },
			{
				...SCORE_PENALTY,
				time: { isEnabled: true, seconds: 3 },
			},
		);
		expect(lastSecond.phase).toBe("finished");
		expect(lastSecond.score).toBe(0);
	});
});
