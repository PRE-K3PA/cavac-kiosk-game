import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { cleanup, renderHook } from "@testing-library/react";
import { useSound } from "@/hooks/useSound";
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
