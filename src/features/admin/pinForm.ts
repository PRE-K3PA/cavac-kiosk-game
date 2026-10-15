import { LIMITS } from "@/data/schema";

const PIN_CHANGE_FIELDS = ["current", "next", "confirm"] as const;

export type PinChangeField = (typeof PIN_CHANGE_FIELDS)[number];
export type PinChangeForm = Record<PinChangeField, string>;
export type PinChangeErrors = Partial<Record<PinChangeField, string>>;

export const EMPTY_PIN_CHANGE_FORM: PinChangeForm = { current: "", next: "", confirm: "" };

export const PIN_CHANGE_MESSAGES = {
	tooShort: `${LIMITS.pinLength}자리 숫자를 입력해 주세요.`,
	sameAsCurrent: "지금 쓰는 PIN과 다른 번호를 입력해 주세요.",
	confirmMismatch: "새 PIN과 확인 PIN이 다릅니다.",
	wrongCurrent: "현재 PIN이 맞지 않습니다.",
} as const;

export function isPinComplete(pin: string) {
	return pin.length === LIMITS.pinLength;
}

export function appendPinDigit(pin: string, digit: string) {
	if (pin.length >= LIMITS.pinLength) return pin;
	return pin + digit;
}

export function deletePinDigit(pin: string) {
	return pin.slice(0, -1);
}

export function validatePinChange(form: PinChangeForm): PinChangeErrors {
	const errors: PinChangeErrors = {};

	if (!isPinComplete(form.current)) errors.current = PIN_CHANGE_MESSAGES.tooShort;

	if (!isPinComplete(form.next)) {
		errors.next = PIN_CHANGE_MESSAGES.tooShort;
	} else if (form.next === form.current) {
		errors.next = PIN_CHANGE_MESSAGES.sameAsCurrent;
	}

	if (!isPinComplete(form.confirm)) {
		errors.confirm = PIN_CHANGE_MESSAGES.tooShort;
	} else if (form.confirm !== form.next) {
		errors.confirm = PIN_CHANGE_MESSAGES.confirmMismatch;
	}

	return errors;
}

export function hasPinChangeErrors(errors: PinChangeErrors) {
	return Object.keys(errors).length > 0;
}

const DEPENDENT_FIELDS: Record<PinChangeField, PinChangeField[]> = {
	current: ["current", "next"],
	next: ["next", "confirm"],
	confirm: ["confirm"],
};

export function clearEditedFieldErrors(
	errors: PinChangeErrors,
	previous: PinChangeForm,
	edited: PinChangeForm,
): PinChangeErrors {
	const remaining = { ...errors };
	for (const field of PIN_CHANGE_FIELDS) {
		if (previous[field] === edited[field]) continue;
		for (const cleared of DEPENDENT_FIELDS[field]) delete remaining[cleared];
	}
	return remaining;
}
