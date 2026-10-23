import { describe, expect, test } from "bun:test";
import { createDefaultData } from "@/data/defaults";
import { LIMITS } from "@/data/schema";
import {
	getHintDelayOptions,
	getHintWarning,
	HINT_DELAY_PRESETS,
} from "@/features/admin/vaccineSettings";
import type { VaccineGameData } from "@/types/data";

function vaccineGameWithHint(hint: VaccineGameData["settings"]["hint"]): VaccineGameData {
	const data = createDefaultData("vaccine-game");
	return { ...data, settings: { ...data.settings, hint } };
}

describe("getHintDelayOptions", () => {
	test("미리 정한 값은 모두 저장 가능한 범위 안에 있고 기본값을 포함한다", () => {
		const { min, max } = LIMITS.hintDelaySeconds;
		for (const seconds of HINT_DELAY_PRESETS) {
			expect(seconds).toBeGreaterThanOrEqual(min);
			expect(seconds).toBeLessThanOrEqual(max);
		}

		const { delaySeconds } = createDefaultData("vaccine-game").settings.hint;
		expect(getHintDelayOptions(delaySeconds)).toHaveLength(HINT_DELAY_PRESETS.length);
	});

	test("파일 값이 목록에 있으면 그대로 돌려준다", () => {
		expect(getHintDelayOptions(15).map((option) => option.value)).toEqual([...HINT_DELAY_PRESETS]);
	});

	test("목록 밖의 파일 값은 순서에 맞춰 끼워 넣는다", () => {
		expect(getHintDelayOptions(7).map((option) => option.value)).toEqual([
			5, 7, 10, 15, 20, 25, 30,
		]);
		expect(getHintDelayOptions(1).at(0)).toEqual({ value: 1, label: "1초" });
	});
});

describe("getHintWarning", () => {
	test("힌트 시간이 제한 시간보다 짧으면 경고하지 않는다", () => {
		expect(getHintWarning(vaccineGameWithHint({ isEnabled: true, delaySeconds: 25 }), 30)).toBe(
			null,
		);
	});

	test("힌트 시간이 제한 시간 이상이면 제한 시간을 넣어 경고한다", () => {
		expect(getHintWarning(vaccineGameWithHint({ isEnabled: true, delaySeconds: 30 }), 30)).toBe(
			"제한 시간(30초) 안에 힌트가 나오지 않습니다.",
		);
		expect(getHintWarning(vaccineGameWithHint({ isEnabled: true, delaySeconds: 30 }), 15)).toBe(
			"제한 시간(15초) 안에 힌트가 나오지 않습니다.",
		);
	});

	test("힌트를 끄면 시간이 길어도 경고하지 않는다", () => {
		expect(getHintWarning(vaccineGameWithHint({ isEnabled: false, delaySeconds: 30 }), 15)).toBe(
			null,
		);
	});
});
