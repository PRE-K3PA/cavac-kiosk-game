import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useSound, useSoundWhile } from "@/hooks/useSound";
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
