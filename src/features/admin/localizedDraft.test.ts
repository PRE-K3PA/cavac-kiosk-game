import { describe, expect, mock, test } from "bun:test";
import * as storage from "@/data/storage";

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getImageUrl: (path: string) => `file://${path}`,
}));

const { toCompleteLocalized, toImageSrcs } = await import("@/features/admin/localizedDraft");

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

describe("고르는 중인 사진의 화면 주소", () => {
	test("KR·EN 사진이 모두 있으면 둘 다 화면 주소로 바꾼다", () => {
		expect(toImageSrcs(IMAGE)).toEqual({ ko: `file://${IMAGE.ko}`, en: `file://${IMAGE.en}` });
	});

	test("한쪽만 골랐으면 그쪽만 주소가 있다", () => {
		expect(toImageSrcs({ ko: IMAGE.ko })).toEqual({ ko: `file://${IMAGE.ko}`, en: undefined });
		expect(toImageSrcs({ en: IMAGE.en })).toEqual({ ko: undefined, en: `file://${IMAGE.en}` });
	});

	test("아무것도 고르지 않았으면 두 칸 모두 비어 있다", () => {
		expect(toImageSrcs({})).toEqual({ ko: undefined, en: undefined });
	});
});
