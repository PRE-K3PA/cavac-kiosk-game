import { afterEach, beforeEach, describe, expect, jest, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { useLimitNotice } from "@/features/admin/useLimitNotice";

beforeEach(() => {
	jest.useFakeTimers();
});

afterEach(() => {
	cleanup();
	jest.useRealTimers();
});

function advance(ms: number) {
	act(() => {
		jest.advanceTimersByTime(ms);
	});
}

function renderLimitNotice() {
	return renderHook(() => useLimitNotice());
}

type LimitNotice = ReturnType<typeof renderLimitNotice>["result"];

function showLimitNotice(result: LimitNotice) {
	act(() => result.current.showLimitNotice());
}

function hideLimitNotice(result: LimitNotice) {
	act(() => result.current.hideLimitNotice());
}

describe("useLimitNotice", () => {
	test("처음에는 보이지 않는다", () => {
		const { result } = renderLimitNotice();

		expect(result.current.isLimitNoticeShown).toBe(false);
	});

	test("보이면 3초 뒤 저절로 사라진다", () => {
		const { result } = renderLimitNotice();
		showLimitNotice(result);
		expect(result.current.isLimitNoticeShown).toBe(true);

		advance(2_999);
		expect(result.current.isLimitNoticeShown).toBe(true);

		advance(1);
		expect(result.current.isLimitNoticeShown).toBe(false);
	});

	test("보이는 중에 다시 보이면 3초를 처음부터 다시 센다", () => {
		const { result } = renderLimitNotice();
		showLimitNotice(result);
		advance(2_000);
		showLimitNotice(result);

		advance(2_000);
		expect(result.current.isLimitNoticeShown).toBe(true);

		advance(1_000);
		expect(result.current.isLimitNoticeShown).toBe(false);
	});

	test("숨기면 바로 사라지고, 남은 타이머가 다음 안내를 지우지 않는다", () => {
		const { result } = renderLimitNotice();
		showLimitNotice(result);
		advance(2_000);
		hideLimitNotice(result);
		expect(result.current.isLimitNoticeShown).toBe(false);

		showLimitNotice(result);
		advance(1_000);
		expect(result.current.isLimitNoticeShown).toBe(true);
	});
});
