import { describe, expect, test } from "bun:test";
import { LIMITS } from "@/data/schema";
import {
	appendPinDigit,
	clearEditedFieldErrors,
	deletePinDigit,
	EMPTY_PIN_CHANGE_FORM,
	hasPinChangeErrors,
	isPinComplete,
	PIN_CHANGE_MESSAGES,
	validatePinChange,
} from "@/features/admin/pinForm";

const FULL_PIN = "1".repeat(LIMITS.pinLength);
const OTHER_PIN = "2".repeat(LIMITS.pinLength);

describe("PIN 입력", () => {
	test("PIN 자리수까지만 숫자를 붙인다", () => {
		expect(appendPinDigit("", "1")).toBe("1");
		expect(appendPinDigit(FULL_PIN, "9")).toBe(FULL_PIN);
	});

	test("마지막 숫자를 지우고, 빈 입력은 그대로 둔다", () => {
		expect(deletePinDigit("12")).toBe("1");
		expect(deletePinDigit("")).toBe("");
	});

	test("PIN 자리수를 다 채워야 완성이다", () => {
		expect(isPinComplete(FULL_PIN)).toBe(true);
		expect(isPinComplete(FULL_PIN.slice(1))).toBe(false);
	});
});

describe("PIN 변경 검사", () => {
	test("올바른 입력은 오류가 없다", () => {
		const errors = validatePinChange({ current: FULL_PIN, next: OTHER_PIN, confirm: OTHER_PIN });
		expect(hasPinChangeErrors(errors)).toBe(false);
	});

	test("빈 입력은 칸마다 자리수 오류를 낸다", () => {
		expect(validatePinChange(EMPTY_PIN_CHANGE_FORM)).toEqual({
			current: PIN_CHANGE_MESSAGES.tooShort,
			next: PIN_CHANGE_MESSAGES.tooShort,
			confirm: PIN_CHANGE_MESSAGES.tooShort,
		});
	});

	test("새 PIN 이 현재 PIN 과 같으면 새 PIN 칸에 오류를 낸다", () => {
		const errors = validatePinChange({ current: FULL_PIN, next: FULL_PIN, confirm: FULL_PIN });
		expect(errors).toEqual({ next: PIN_CHANGE_MESSAGES.sameAsCurrent });
	});

	test("확인 PIN 이 새 PIN 과 다르면 확인 칸에 오류를 낸다", () => {
		const errors = validatePinChange({ current: FULL_PIN, next: OTHER_PIN, confirm: FULL_PIN });
		expect(errors).toEqual({ confirm: PIN_CHANGE_MESSAGES.confirmMismatch });
	});

	test("고친 칸의 오류만 지운다", () => {
		const errors = {
			current: PIN_CHANGE_MESSAGES.wrongCurrent,
			confirm: PIN_CHANGE_MESSAGES.confirmMismatch,
		};
		const previous = { current: FULL_PIN, next: OTHER_PIN, confirm: FULL_PIN };
		const edited = { ...previous, confirm: OTHER_PIN };
		expect(clearEditedFieldErrors(errors, previous, edited)).toEqual({
			current: PIN_CHANGE_MESSAGES.wrongCurrent,
		});
	});

	test("현재 PIN 을 고치면 같은 번호 오류가 난 새 PIN 칸의 오류도 지운다", () => {
		const errors = { next: PIN_CHANGE_MESSAGES.sameAsCurrent };
		const previous = { current: FULL_PIN, next: FULL_PIN, confirm: FULL_PIN };
		const edited = { ...previous, current: OTHER_PIN };
		expect(clearEditedFieldErrors(errors, previous, edited)).toEqual({});
	});

	test("새 PIN 을 고치면 확인 칸의 불일치 오류도 지운다", () => {
		const errors = { confirm: PIN_CHANGE_MESSAGES.confirmMismatch };
		const previous = { current: FULL_PIN, next: OTHER_PIN, confirm: FULL_PIN };
		const edited = { ...previous, next: FULL_PIN };
		expect(clearEditedFieldErrors(errors, previous, edited)).toEqual({});
	});
});
