import { describe, expect, test } from "bun:test";
import { fitStage } from "@/layout/stage";

describe("화면 스케일 계산", () => {
	test.each([
		["FHD", 1920, 1080, 1],
		["QHD", 2560, 1440, 2560 / 1920],
		["4K", 3840, 2160, 2],
	])("%s 가로 창은 가로 기준 크기에 맞춘다", (_name, width, height, scale) => {
		expect(fitStage({ width, height })).toEqual({ orientation: "landscape", scale });
	});

	test.each([
		["FHD", 1080, 1920, 1],
		["4K", 2160, 3840, 2],
	])("%s 세로 창은 세로 기준 크기로 바뀐다", (_name, width, height, scale) => {
		expect(fitStage({ width, height })).toEqual({ orientation: "portrait", scale });
	});

	test("16:9 보다 넓은 창은 높이에 맞춰 콘텐츠가 잘리지 않는다", () => {
		const { scale } = fitStage({ width: 2560, height: 1080 });
		expect(scale).toBe(1);
		expect(1920 * scale).toBeLessThanOrEqual(2560);
	});

	test("16:9 보다 좁은 창은 너비에 맞춘다", () => {
		expect(fitStage({ width: 1920, height: 1440 }).scale).toBe(1);
		expect(fitStage({ width: 1280, height: 1024 }).scale).toBeCloseTo(1280 / 1920);
	});

	test("정사각형 창은 가로로 본다", () => {
		expect(fitStage({ width: 1000, height: 1000 }).orientation).toBe("landscape");
	});

	test.each([
		[0, 0],
		[0, 1080],
		[Number.NaN, 1080],
	])("크기가 올바르지 않으면(%p x %p) 원본 크기로 둔다", (width, height) => {
		expect(fitStage({ width, height })).toEqual({ orientation: "landscape", scale: 1 });
	});
});
