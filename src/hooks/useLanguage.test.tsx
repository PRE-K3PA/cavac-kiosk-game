import { describe, expect, test } from "bun:test";
import { act, renderHook } from "@testing-library/react";
import { useLanguage } from "@/hooks/useLanguage";

describe("useLanguage", () => {
	test("처음에는 한국어다", () => {
		const { result } = renderHook(() => useLanguage());
		expect(result.current.language).toBe("ko");
	});

	test("토글하면 영어가 되고, 다시 토글하면 한국어로 돌아온다", () => {
		const { result } = renderHook(() => useLanguage());

		act(() => result.current.toggleLanguage());
		expect(result.current.language).toBe("en");

		act(() => result.current.toggleLanguage());
		expect(result.current.language).toBe("ko");
	});
});
