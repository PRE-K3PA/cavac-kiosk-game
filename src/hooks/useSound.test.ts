import { afterEach, beforeEach, describe, expect, jest, spyOn, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import {
	COUNTDOWN_LOOP_MS,
	useCountdownSoundWhile,
	useSound,
	useSoundWhile,
} from "@/hooks/useSound";
import { useSessionStore } from "@/store/sessionStore";
import * as engine from "@/utils/soundEngine";

let played: engine.SoundName[] = [];
let playSpy: ReturnType<typeof spyOn<typeof engine, "playSound">>;

beforeEach(() => {
	played = [];
	playSpy = spyOn(engine, "playSound").mockImplementation((name) => {
		played.push(name);
	});
});

afterEach(() => {
	playSpy.mockRestore();
	cleanup();
	useSessionStore.getState().reset();
});

describe("useSound", () => {
	test("소리가 켜져 있으면 재생한다", () => {
		const { result } = renderHook(() => useSound());
		result.current("pop");

		expect(played).toEqual(["pop"]);
	});

	test("음소거면 재생하지 않는다", () => {
		useSessionStore.getState().toggleMute();
		const { result } = renderHook(() => useSound());
		result.current("pop");

		expect(played).toEqual([]);
	});
});

describe("useSoundWhile", () => {
	let started: engine.SoundName[] = [];
	let stopped: engine.SoundName[] = [];
	let startSpy: ReturnType<typeof spyOn<typeof engine, "startSound">>;

	beforeEach(() => {
		started = [];
		stopped = [];
		startSpy = spyOn(engine, "startSound").mockImplementation((name) => {
			started.push(name);
			return () => stopped.push(name);
		});
	});

	afterEach(() => {
		startSpy.mockRestore();
	});

	test("켜지면 한 번 틀고, 꺼지면 멈춘다", () => {
		const { rerender } = renderHook(({ isActive }) => useSoundWhile("countdown", isActive), {
			initialProps: { isActive: true },
		});
		rerender({ isActive: true });
		expect(started).toEqual(["countdown"]);

		rerender({ isActive: false });
		expect(stopped).toEqual(["countdown"]);
	});

	test("음소거면 틀지 않고, 도중에 음소거하면 멈춘다", () => {
		renderHook(() => useSoundWhile("countdown", true));
		act(() => useSessionStore.getState().toggleMute());

		expect(started).toEqual(["countdown"]);
		expect(stopped).toEqual(["countdown"]);
	});
});

describe("useCountdownSoundWhile", () => {
	// 가장 긴 안내(10쌍 7초)
	const LONGEST_MS = 7000;
	let started: number[] = [];
	let stopped: number[] = [];
	let elapsedMs = 0;
	let startSpy: ReturnType<typeof spyOn<typeof engine, "startSound">>;

	beforeEach(() => {
		jest.useFakeTimers();
		elapsedMs = 0;
		started = [];
		stopped = [];
		startSpy = spyOn(engine, "startSound").mockImplementation(() => {
			const at = elapsedMs;
			started.push(at);
			return () => stopped.push(at);
		});
	});

	afterEach(() => {
		jest.useRealTimers();
		startSpy.mockRestore();
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

	test(`켜지면 틀고, ${COUNTDOWN_LOOP_MS}ms 전에는 다시 틀지 않는다`, () => {
		renderHook(() => useCountdownSoundWhile(true));
		advance(COUNTDOWN_LOOP_MS - 1);

		expect(started).toEqual([0]);
		expect(stopped).toEqual([]);
	});

	test(`${COUNTDOWN_LOOP_MS}ms 마다 앞 소리를 멈추고 처음부터 다시 튼다`, () => {
		renderHook(() => useCountdownSoundWhile(true));
		advance(LONGEST_MS);

		expect(started).toEqual([0, COUNTDOWN_LOOP_MS]);
		expect(stopped).toEqual([0]);
	});

	test("꺼지면 소리를 멈추고 더 틀지 않는다", () => {
		const { rerender } = renderHook(({ isActive }) => useCountdownSoundWhile(isActive), {
			initialProps: { isActive: true },
		});
		advance(1000);
		rerender({ isActive: false });
		advance(COUNTDOWN_LOOP_MS * 2);

		expect(started).toEqual([0]);
		expect(stopped).toEqual([0]);
	});

	test("음소거면 틀지 않는다", () => {
		useSessionStore.getState().toggleMute();
		renderHook(() => useCountdownSoundWhile(true));
		advance(LONGEST_MS);

		expect(started).toEqual([]);
	});

	test("도중에 음소거하면 바로 멈추고 더 틀지 않는다", () => {
		renderHook(() => useCountdownSoundWhile(true));
		advance(1000);
		act(() => useSessionStore.getState().toggleMute());
		advance(COUNTDOWN_LOOP_MS * 2);

		expect(started).toEqual([0]);
		expect(stopped).toEqual([0]);
	});
});
