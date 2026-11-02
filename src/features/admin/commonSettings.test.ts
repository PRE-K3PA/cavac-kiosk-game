import { describe, expect, test } from "bun:test";
import { LIMITS } from "@/data/schema";
import { getIdleSecondsOptions, IDLE_SECONDS_PRESETS } from "@/features/admin/commonSettings";

describe("getIdleSecondsOptions", () => {
	test("미리 정한 값은 모두 저장 가능한 범위 안에 있다", () => {
		const { min, max } = LIMITS.idleSeconds;
		for (const seconds of IDLE_SECONDS_PRESETS) {
			expect(seconds).toBeGreaterThanOrEqual(min);
			expect(seconds).toBeLessThanOrEqual(max);
		}
	});

	test("현재 값이 목록에 있으면 그대로 돌려준다", () => {
		expect(getIdleSecondsOptions(60).map((option) => option.value)).toEqual([
			...IDLE_SECONDS_PRESETS,
		]);
	});

	test("목록 밖의 현재 값은 순서에 맞춰 끼워 넣는다", () => {
		expect(getIdleSecondsOptions(45).map((option) => option.value)).toEqual([
			20, 30, 45, 60, 90, 120, 180,
		]);
		expect(getIdleSecondsOptions(600).at(-1)).toEqual({ value: 600, label: "600초" });
	});
});
