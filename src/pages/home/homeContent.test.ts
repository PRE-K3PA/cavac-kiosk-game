/// <reference path="../../vite-env.d.ts" />
import { describe, expect, test } from "bun:test";
import { CARD_HOME } from "@/pages/card/cardHomeContent";
import { VACCINE_HOME } from "@/pages/vaccine/vaccineHomeContent";

const HOME_CONTENTS = [
	["백신 제조 홈", VACCINE_HOME],
	["카드 매치 홈", CARD_HOME],
] as const;

describe.each(HOME_CONTENTS)("%s 문구 구성", (_name, content) => {
	test("제목과 부제가 한국어와 영어 모두 비어 있지 않다", () => {
		for (const language of ["ko", "en"] as const) {
			expect(content.title[language].accent.trim()).not.toBe("");
			expect(content.title[language].rest.trim()).not.toBe("");
			expect(content.subtitle[language].trim()).not.toBe("");
		}
	});

	test("게임 방법은 3단계이고 단계마다 두 언어 설명과 그림이 있다", () => {
		expect(content.steps).toHaveLength(3);
		for (const step of content.steps) {
			expect(step.description.ko.trim()).not.toBe("");
			expect(step.description.en.trim()).not.toBe("");
			expect(step.media.src).toBeTruthy();
		}
	});

	test("단계 설명이 서로 겹치지 않는다", () => {
		const koreanDescriptions = content.steps.map((step) => step.description.ko);
		expect(new Set(koreanDescriptions).size).toBe(3);
	});
});
