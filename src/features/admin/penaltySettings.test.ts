import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import { validateForSave } from "@/data/rules";
import {
	getPenaltyErrorMessage,
	getPenaltyInputValue,
	PENALTY_LIMITS,
	PENALTY_ROWS,
	setPenaltyEnabled,
	setPenaltyValue,
} from "@/features/admin/penaltySettings";
import type { CardGameData, Penalty } from "@/types/data";

/** 목데이터 패널티: 시간 차감 켬 3초, 점수 차감 끔 50점 */
function filledCardGame(): CardGameData {
	return createMockData("filled")["card-game"];
}

function withPenalty(data: CardGameData, penalty: Penalty): CardGameData {
	return { ...data, settings: { ...data.settings, penalty } };
}

describe("setPenaltyValue", () => {
	test("고른 줄의 값만 바꾼다", () => {
		const penalty = filledCardGame().settings.penalty;

		expect(setPenaltyValue(penalty, "time", 10)).toEqual({
			...penalty,
			time: { ...penalty.time, seconds: 10 },
		});
		expect(setPenaltyValue(penalty, "score", 100)).toEqual({
			...penalty,
			score: { ...penalty.score, points: 100 },
		});
	});

	test.each(PENALTY_ROWS.map((row) => row.key))(
		"%s 칸을 비우면 빈 칸으로 읽히고 저장이 막힌다",
		(key) => {
			const data = filledCardGame();
			const blank = setPenaltyValue(data.settings.penalty, key, null);

			expect(getPenaltyInputValue(blank, key)).toBeNull();
			expect(validateForSave("card-game", data).isValid).toBe(true);
			expect(validateForSave("card-game", withPenalty(data, blank)).isValid).toBe(false);
		},
	);
});

describe("getPenaltyInputValue", () => {
	test("값이 있으면 그대로 읽는다", () => {
		expect(getPenaltyInputValue(filledCardGame().settings.penalty, "time")).toBe(3);
	});
});

describe("getPenaltyErrorMessage", () => {
	test("범위 안의 값은 오류가 없다", () => {
		const penalty = filledCardGame().settings.penalty;
		const { min, max } = PENALTY_LIMITS.score;

		expect(getPenaltyErrorMessage(penalty, "time")).toBeNull();
		expect(getPenaltyErrorMessage(setPenaltyValue(penalty, "score", min), "score")).toBeNull();
		expect(getPenaltyErrorMessage(setPenaltyValue(penalty, "score", max), "score")).toBeNull();
	});

	test("비운 칸은 값을 입력하라고 알린다 (Figma _PenaltyEmpty)", () => {
		const blank = setPenaltyValue(filledCardGame().settings.penalty, "time", null);

		expect(getPenaltyErrorMessage(blank, "time")).toBe("패널티 값을 입력해 주세요.");
	});

	test("범위 밖 값은 줄마다 허용 범위와 단위를 알린다", () => {
		const penalty = filledCardGame().settings.penalty;

		expect(getPenaltyErrorMessage(setPenaltyValue(penalty, "time", 45), "time")).toBe(
			"1~30초 사이로 입력해 주세요.",
		);
		expect(getPenaltyErrorMessage(setPenaltyValue(penalty, "score", 999), "score")).toBe(
			"1~500점 사이로 입력해 주세요.",
		);
	});
});

describe("setPenaltyEnabled", () => {
	test("범위 안의 값은 줄을 꺼도 그대로 두고, 다른 줄은 건드리지 않는다", () => {
		const original = filledCardGame().settings.penalty;
		const penalty = setPenaltyValue(original, "time", 7);

		const disabled = setPenaltyEnabled(penalty, original, "time", false);

		expect(disabled.time).toEqual({ isEnabled: false, seconds: 7 });
		expect(disabled.score).toEqual(penalty.score);
	});

	test("범위 밖 값으로 시간 차감 줄을 끄면 원래 값으로 되돌려 저장이 통과한다", () => {
		const data = filledCardGame();
		const original = data.settings.penalty;
		const blank = setPenaltyValue(original, "time", null);

		const disabled = setPenaltyEnabled(blank, original, "time", false);

		expect(disabled.time).toEqual({ isEnabled: false, seconds: original.time.seconds });
		expect(disabled.score).toEqual(original.score);
		expect(validateForSave("card-game", withPenalty(data, disabled)).isValid).toBe(true);
	});

	test("범위 밖 값으로 점수 차감 줄을 끄면 원래 값으로 되돌려 저장이 통과한다", () => {
		const data = filledCardGame();
		const original = data.settings.penalty;
		const enabled = setPenaltyEnabled(original, original, "score", true);
		const outOfRange = setPenaltyValue(enabled, "score", 999);

		const disabled = setPenaltyEnabled(outOfRange, original, "score", false);

		expect(disabled.score).toEqual({ isEnabled: false, points: original.score.points });
		expect(disabled.time).toEqual(original.time);
		expect(validateForSave("card-game", withPenalty(data, disabled)).isValid).toBe(true);
	});

	test("줄을 켤 때는 범위 밖 값도 그대로 두어 오류가 보이게 한다", () => {
		const original = filledCardGame().settings.penalty;
		const blank = setPenaltyValue(original, "score", null);

		const enabled = setPenaltyEnabled(blank, original, "score", true);

		expect(enabled.score.isEnabled).toBe(true);
		expect(getPenaltyInputValue(enabled, "score")).toBeNull();
		expect(getPenaltyErrorMessage(enabled, "score")).not.toBeNull();
	});
});
