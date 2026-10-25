import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { createMockData } from "@/data/mock/mock-platform";
import { useVaccineGameSounds } from "@/features/vaccine-game/hooks/useVaccineGameSounds";
import { createPlay, type PlayState, tapFalling } from "@/features/vaccine-game/utils/play";
import { createFallingAntigen } from "@/features/vaccine-game/utils/spawn";
import { useSessionStore } from "@/store/sessionStore";
import type { Antigen, Vaccine } from "@/types/data";
import * as engine from "@/utils/soundEngine";

function antigen(abbr: string): Antigen {
	return { id: abbr, abbr, subtype: null, pathogenType: "virus", isPinned: false };
}

function vaccine(id: string, antigens: Antigen[]): Vaccine {
	return { ...createMockData("filled")["vaccine-game"].vaccines[0], id, antigens };
}

const HA = antigen("HA");

function play(): PlayState {
	const settings = createMockData("filled")["vaccine-game"].settings;
	const state = createPlay([vaccine("a", [HA, antigen("NA")])], settings, 60);
	return { ...state, falling: [{ ...createFallingAntigen(1, HA, 0), y: 100 }], nextId: 2 };
}

let played: engine.SoundName[] = [];
let playSpy: ReturnType<typeof spyOn<typeof engine, "playSound">>;

function renderSounds(initial: PlayState) {
	return renderHook(({ state }) => useVaccineGameSounds(state), {
		initialProps: { state: initial },
	});
}

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

describe("useVaccineGameSounds", () => {
	test("처음 그릴 때는 소리를 내지 않는다", () => {
		renderSounds(play());

		expect(played).toEqual([]);
	});

	test("상태가 바뀌면 고른 소리를 낸다", () => {
		const before = play();
		const { rerender } = renderSounds(before);

		rerender({ state: tapFalling(before, 1) });

		expect(played).toEqual([engine.SOUND_NAMES.match]);
	});

	test("같은 상태로 다시 그려도 소리를 다시 내지 않는다", () => {
		const before = play();
		const tapped = tapFalling(before, 1);
		const { rerender } = renderSounds(before);

		rerender({ state: tapped });
		rerender({ state: tapped });

		expect(played).toEqual([engine.SOUND_NAMES.match]);
	});

	test("음소거면 소리가 나지 않는다", () => {
		act(() => useSessionStore.getState().toggleMute());
		const before = play();
		const { rerender } = renderSounds(before);

		rerender({ state: tapFalling(before, 1) });

		expect(played).toEqual([]);
	});
});
