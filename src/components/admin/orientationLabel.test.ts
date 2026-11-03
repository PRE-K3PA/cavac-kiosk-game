import { describe, expect, test } from "bun:test";
import { formatOrientationBasis } from "@/components/admin/orientationLabel";

describe("미리보기 화면 방향 캡션", () => {
	test("가로 화면 기준 문구를 만든다", () => {
		expect(formatOrientationBasis("landscape")).toBe("가로 화면 기준");
	});

	test("세로 화면 기준 문구를 만든다", () => {
		expect(formatOrientationBasis("portrait")).toBe("세로 화면 기준");
	});
});
