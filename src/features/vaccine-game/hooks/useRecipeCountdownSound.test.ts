import { afterEach, beforeEach, describe, expect, jest, spyOn, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import {
	COUNTDOWN_LOOP_MS,
	useRecipeCountdownSound,
} from "@/features/vaccine-game/hooks/useRecipeCountdownSound";
import { useSessionStore } from "@/store/sessionStore";
import * as engine from "@/utils/soundEngine";

// 백신 5개일 때의 레시피 시간입니다 (getRecipeSeconds)
const LONGEST_RECIPE_MS = 7000;

let started: { name: engine.SoundName; at: number }[] = [];
let stopped: number[] = [];
let startSpy: ReturnType<typeof spyOn<typeof engine, "startSound">>;
let elapsedMs = 0;

beforeEach(() => {
	jest.useFakeTimers();
	elapsedMs = 0;
	started = [];
	stopped = [];
	startSpy = spyOn(engine, "startSound").mockImplementation((name) => {
		const at = elapsedMs;
		started.push({ name, at });
		return () => stopped.push(at);
	});
});

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	startSpy.mockRestore();
	useSessionStore.getState().reset();
});

// 소리를 튼 시각을 기록하려고 1초씩 나눠 흘려보냅니다
function advance(ms: number) {
	for (let left = ms; left > 0; left -= 1000) {
		const step = Math.min(left, 1000);
		act(() => {
			elapsedMs += step;
			jest.advanceTimersByTime(step);
		});
	}
}

describe("useRecipeCountdownSound", () => {
	test("화면에 들어오면 카운트다운을 한 번 튼다", () => {
		renderHook(() => useRecipeCountdownSound());

		expect(started).toEqual([{ name: engine.SOUND_NAMES.countdown, at: 0 }]);
	});

	test(`${COUNTDOWN_LOOP_MS}ms 가 되기 전에는 다시 틀지 않는다`, () => {
		renderHook(() => useRecipeCountdownSound());
		advance(COUNTDOWN_LOOP_MS - 1);

		expect(started).toHaveLength(1);
		expect(stopped).toEqual([]);
	});

	test(`${COUNTDOWN_LOOP_MS}ms 가 되면 앞 소리를 멈추고 처음부터 다시 튼다`, () => {
		renderHook(() => useRecipeCountdownSound());
		advance(COUNTDOWN_LOOP_MS);

		expect(stopped).toEqual([0]);
		expect(started.map((sound) => sound.at)).toEqual([0, COUNTDOWN_LOOP_MS]);
	});

	test("가장 긴 레시피 동안에도 한 소리를 끝까지 틀지 않고 되풀이한다", () => {
		renderHook(() => useRecipeCountdownSound());
		advance(LONGEST_RECIPE_MS);

		const playedMs = started.map((sound, index) => {
			const end = started[index + 1]?.at ?? LONGEST_RECIPE_MS;
			return end - sound.at;
		});
		for (const ms of playedMs) expect(ms).toBeLessThanOrEqual(COUNTDOWN_LOOP_MS);
	});

	test("화면을 떠나면 소리를 멈추고 더 틀지 않는다", () => {
		const view = renderHook(() => useRecipeCountdownSound());
		advance(1000);
		view.unmount();
		advance(COUNTDOWN_LOOP_MS * 2);

		expect(started).toHaveLength(1);
		expect(stopped).toEqual([0]);
	});

	test("음소거면 틀지 않는다", () => {
		useSessionStore.getState().toggleMute();
		renderHook(() => useRecipeCountdownSound());
		advance(LONGEST_RECIPE_MS);

		expect(started).toEqual([]);
	});

	test("도중에 음소거하면 바로 멈추고 더 틀지 않는다", () => {
		renderHook(() => useRecipeCountdownSound());
		advance(1000);
		act(() => useSessionStore.getState().toggleMute());
		advance(COUNTDOWN_LOOP_MS * 2);

		expect(started).toHaveLength(1);
		expect(stopped).toEqual([0]);
	});
});
