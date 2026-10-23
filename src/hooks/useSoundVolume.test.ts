import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { createDefaultData } from "@/data/defaults";
import * as storage from "@/data/storage";
import type { CommonData } from "@/types/data";
import * as engine from "@/utils/soundEngine";

let storedCommon: CommonData = createDefaultData("common");
let isReadFailing = false;

async function getStoredCommon(): Promise<CommonData> {
	if (isReadFailing) throw new Error("read failed");
	return storedCommon;
}

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getData: getStoredCommon,
}));

const { useSoundVolume } = await import("@/hooks/useSoundVolume");

let setVolumeSpy: ReturnType<typeof spyOn<typeof engine, "setVolume">>;

beforeEach(() => {
	storedCommon = createDefaultData("common");
	isReadFailing = false;
	setVolumeSpy = spyOn(engine, "setVolume").mockImplementation(() => {});
});

afterEach(() => {
	setVolumeSpy.mockRestore();
	cleanup();
});

describe("useSoundVolume", () => {
	test("저장한 소리 크기를 적용한다", async () => {
		storedCommon = { ...storedCommon, volume: { bgmPercent: 20, sfxPercent: 70 } };
		renderHook(() => useSoundVolume());

		await waitFor(() =>
			expect(setVolumeSpy).toHaveBeenCalledWith({ bgmPercent: 20, sfxPercent: 70 }),
		);
	});

	test("설정을 읽지 못하면 기본 크기를 적용한다", async () => {
		isReadFailing = true;
		renderHook(() => useSoundVolume());

		await waitFor(() =>
			expect(setVolumeSpy).toHaveBeenCalledWith(createDefaultData("common").volume),
		);
	});
});
