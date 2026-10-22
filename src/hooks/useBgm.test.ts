import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useBgm } from "@/hooks/useBgm";
import { useSessionStore } from "@/store/sessionStore";
import * as engine from "@/utils/soundEngine";

let playSpy: ReturnType<typeof spyOn<typeof engine, "playBgm">>;
let stopSpy: ReturnType<typeof spyOn<typeof engine, "stopBgm">>;

beforeEach(() => {
	playSpy = spyOn(engine, "playBgm").mockImplementation(() => {});
	stopSpy = spyOn(engine, "stopBgm").mockImplementation(() => {});
});

afterEach(() => {
	playSpy.mockRestore();
	stopSpy.mockRestore();
	cleanup();
	useSessionStore.getState().reset();
});

describe("useBgm", () => {
	test("화면에 있는 동안 배경음을 틀고, 떠나면 멈춘다", () => {
		const { unmount } = renderHook(() => useBgm(engine.BGM_NAMES.cardHome));

		expect(playSpy).toHaveBeenCalledWith("cardHome");
		expect(stopSpy).not.toHaveBeenCalled();

		unmount();
		expect(stopSpy).toHaveBeenCalledTimes(1);
	});

	test("음소거면 틀지 않고, 음소거하면 멈춘다", () => {
		renderHook(() => useBgm(engine.BGM_NAMES.cardGame));
		act(() => useSessionStore.getState().toggleMute());

		expect(stopSpy).toHaveBeenCalledTimes(1);
		expect(playSpy).toHaveBeenCalledTimes(1);
	});

	test("null 이면 틀지 않는다", () => {
		renderHook(() => useBgm(null));

		expect(playSpy).not.toHaveBeenCalled();
	});
});
