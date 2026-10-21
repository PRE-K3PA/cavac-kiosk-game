import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import { getNeededAntigens, isGameOver, SCORE } from "@/features/vaccine-game/game";
import {
	advancePlay,
	CORRECT_VISIBLE_MS,
	createPlay,
	FEEDBACK_VISIBLE_MS,
	FULL_BOTTLE_VISIBLE_MS,
	isBottleFull,
	type PlayOptions,
	type PlayState,
	tapFalling,
} from "@/features/vaccine-game/play";
import { createFallingAntigen } from "@/features/vaccine-game/spawn";
import type { Antigen, Vaccine } from "@/types/data";

function antigen(abbr: string): Antigen {
	return { id: abbr, abbr, subtype: null, pathogenType: "virus", isPinned: false };
}

function vaccine(id: string, antigens: Antigen[]): Vaccine {
	return { ...createMockData("filled")["vaccine-game"].vaccines[0], id, antigens };
}

const HA = antigen("HA");
const ND = antigen("ND");

const ROUND = [vaccine("a", [HA, antigen("NA")]), vaccine("b", [ND])];

const OPTIONS: PlayOptions = {
	allVaccines: ROUND,
	field: { width: 1000, height: 900, ballSize: 200 },
	random: () => 0,
};

function play(): PlayState {
	const data = createMockData("filled")["vaccine-game"];
	return createPlay(ROUND, data.settings, 60);
}

function withFalling(state: PlayState, item: Antigen, y = 100): PlayState {
	return { ...state, falling: [{ ...createFallingAntigen(1, item, 0), y }], nextId: 2 };
}

describe("advancePlay", () => {
	test("흐른 시간만큼 게임 시간이 지나고 구슬이 아래로 움직인다", () => {
		const state = advancePlay(withFalling(play(), HA), 100, OPTIONS);

		expect(state.game.elapsedMs).toBe(100);
		expect(state.falling[0].y).toBeGreaterThan(100);
	});

	test("떨어뜨릴 간격이 지나면 필요한 항원을 새로 떨어뜨린다", () => {
		const state = advancePlay(play(), 1000, OPTIONS);

		expect(state.falling).toHaveLength(1);
		expect(getNeededAntigens(state.game)).toContainEqual(state.falling[0].antigen);
	});

	test("정답 구슬은 표시 시간이 지나면 지운다", () => {
		const tapped = tapFalling(withFalling(play(), HA), 1);
		const kept = advancePlay(tapped, CORRECT_VISIBLE_MS - 1, OPTIONS);
		const removed = advancePlay(kept, 1, OPTIONS);

		expect(kept.falling.some((item) => item.id === 1)).toBe(true);
		expect(removed.falling.some((item) => item.id === 1)).toBe(false);
	});

	test("게임이 끝나면 더 진행하지 않는다", () => {
		const over = advancePlay(play(), 60_000, OPTIONS);

		expect(isGameOver(over.game)).toBe(true);
		expect(advancePlay(over, 1000, OPTIONS)).toBe(over);
	});
});

describe("tapFalling", () => {
	test("필요한 항원 구슬을 누르면 정답으로 표시하고 점수를 더한다", () => {
		const state = tapFalling(withFalling(play(), HA), 1);

		expect(state.falling[0].judgement).toBe("correct");
		expect(state.game.score).toBe(SCORE.correct);
	});

	test("필요 없는 항원 구슬을 누르면 오답으로 표시하고 안내를 띄운다", () => {
		const state = tapFalling(withFalling(play(), ND), 1);

		expect(state.falling[0].judgement).toBe("wrong");
		expect(state.feedback?.missing.abbr).toBe("HA");
	});

	test("안내는 표시 시간이 지나면 사라진다", () => {
		const tapped = tapFalling(withFalling(play(), ND), 1);
		const later = advancePlay({ ...tapped, falling: [] }, FEEDBACK_VISIBLE_MS, OPTIONS);

		expect(later.feedback).toBeNull();
	});

	test("정답이면 얻은 점수와 구슬 위치를 마지막 터치로 남긴다", () => {
		const state = tapFalling(withFalling(play(), HA, 300), 1);

		expect(state.lastTap).toMatchObject({
			outcome: "correct",
			scoreDelta: SCORE.correct,
			isVaccineCompleted: false,
			x: 0,
			y: 300,
		});
	});

	test("백신을 완성한 터치는 완성으로 남긴다", () => {
		const one = createPlay(
			[vaccine("a", [HA])],
			createMockData("filled")["vaccine-game"].settings,
			60,
		);
		const state = tapFalling(withFalling(one, HA), 1);

		expect(state.lastTap?.isVaccineCompleted).toBe(true);
		expect(state.lastTap?.scoreDelta).toBe(SCORE.correct + SCORE.complete);
	});

	test("오답이면 오답으로 남기고 콤보는 0이다", () => {
		const state = tapFalling(withFalling(play(), ND), 1);

		expect(state.lastTap).toMatchObject({ outcome: "wrong", combo: 0 });
	});

	test("터치할 때마다 순번이 1씩 늘어 같은 결과가 이어져도 구별된다", () => {
		const first = tapFalling(withFalling(play(), ND), 1);
		const second = tapFalling({ ...first, falling: [createFallingAntigen(2, ND, 0)] }, 2);

		expect(second.lastTap?.seq).toBe((first.lastTap?.seq ?? 0) + 1);
	});

	test("이미 오답으로 판정한 구슬을 또 눌러도 패널티를 다시 받지 않는다", () => {
		const tapped = tapFalling(withFalling(play(), ND), 1);

		expect(tapFalling(tapped, 1)).toBe(tapped);
	});

	test("없는 구슬 번호면 그대로다", () => {
		const state = withFalling(play(), HA);

		expect(tapFalling(state, 99)).toBe(state);
	});

	test("받은 상태를 바꾸지 않는다", () => {
		const state = withFalling(play(), HA);
		const before = structuredClone(state);

		tapFalling(state, 1);
		advancePlay(state, 500, OPTIONS);

		expect(state).toEqual(before);
	});
});

describe("isBottleFull", () => {
	function onePlay(): PlayState {
		return createPlay([vaccine("a", [HA])], createMockData("filled")["vaccine-game"].settings, 60);
	}

	test("백신을 완성하기 전에는 가득 찬 병을 보여 주지 않는다", () => {
		expect(isBottleFull(onePlay())).toBe(false);
		expect(isBottleFull(tapFalling(withFalling(play(), HA), 1))).toBe(false);
	});

	test("백신을 완성하면 표시 시간 동안 가득 찬 병을 보여 준다", () => {
		const completed = tapFalling(withFalling(onePlay(), HA), 1);
		const kept = advancePlay(completed, FULL_BOTTLE_VISIBLE_MS - 1, OPTIONS);
		const ended = advancePlay(kept, 1, OPTIONS);

		expect(isBottleFull(completed)).toBe(true);
		expect(isBottleFull(kept)).toBe(true);
		expect(isBottleFull(ended)).toBe(false);
	});

	test("가득 찬 병을 보여 주는 동안 다른 구슬을 눌러도 표시 시간이 지나면 끝난다", () => {
		const completed = tapFalling(withFalling(onePlay(), HA), 1);
		const wrongTapped = tapFalling({ ...completed, falling: [createFallingAntigen(2, ND, 0)] }, 2);
		const ended = advancePlay({ ...wrongTapped, falling: [] }, FULL_BOTTLE_VISIBLE_MS, OPTIONS);

		expect(wrongTapped.lastTap?.outcome).toBe("wrong");
		expect(isBottleFull(wrongTapped)).toBe(true);
		expect(isBottleFull(ended)).toBe(false);
	});
});
