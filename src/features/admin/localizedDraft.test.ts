import { describe, expect, test } from "bun:test";
import { toCompleteLocalized } from "@/features/admin/localizedDraft";

const IMAGE = {
	ko: "images/product/00000000-0000-4000-8000-000000000100.png",
	en: "images/product/00000000-0000-4000-9000-000000000100.png",
};

describe("KR·EN 두 칸 값", () => {
	test("KR·EN 이 모두 있으면 값이 된다", () => {
		expect(toCompleteLocalized({ ko: IMAGE.ko, en: IMAGE.en })).toEqual(IMAGE);
	});

	test("한쪽 언어만 있으면 값이 아니다", () => {
		expect(toCompleteLocalized({ ko: IMAGE.ko })).toBeUndefined();
		expect(toCompleteLocalized({ en: IMAGE.en })).toBeUndefined();
	});

	test("빈 문자열은 비어 있는 것으로 본다", () => {
		expect(toCompleteLocalized({ ko: IMAGE.ko, en: "" })).toBeUndefined();
		expect(toCompleteLocalized({})).toBeUndefined();
	});
});
