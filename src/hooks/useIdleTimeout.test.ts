import { afterEach, beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { act, cleanup, fireEvent, renderHook } from "@testing-library/react";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";

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

function renderIdle(isEnabled: boolean, idleSeconds: number) {
	const onTimeout = mock(() => {});
	const view = renderHook(() => useIdleTimeout({ isEnabled, idleSeconds, onTimeout }));
	return { ...view, onTimeout };
}

describe("useIdleTimeout", () => {
	test("정한 시간 동안 터치가 없으면 한 번 부른다", () => {
		const { onTimeout } = renderIdle(true, 30);

		advance(29_999);
		expect(onTimeout).not.toHaveBeenCalled();

		advance(1);
		expect(onTimeout).toHaveBeenCalledTimes(1);
	});

	test("터치하면 처음부터 다시 센다", () => {
		const { onTimeout } = renderIdle(true, 30);

		advance(20_000);
		fireEvent.pointerDown(document.body);
		advance(20_000);
		expect(onTimeout).not.toHaveBeenCalled();

		advance(10_000);
		expect(onTimeout).toHaveBeenCalledTimes(1);
	});

	test("꺼져 있으면 부르지 않는다", () => {
		const { onTimeout } = renderIdle(false, 30);

		advance(600_000);
		expect(onTimeout).not.toHaveBeenCalled();
	});

	test("화면을 떠나면 부르지 않는다", () => {
		const { onTimeout, unmount } = renderIdle(true, 30);

		unmount();
		advance(30_000);
		expect(onTimeout).not.toHaveBeenCalled();
	});
});
