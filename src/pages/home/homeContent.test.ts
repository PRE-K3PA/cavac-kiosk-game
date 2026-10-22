/// <reference path="../../vite-env.d.ts" />
import { describe, expect, test } from "bun:test";
import { resources } from "@/i18n";
import { CARD_HOME } from "@/pages/card/cardHomeContent";
import { VACCINE_HOME } from "@/pages/vaccine/vaccineHomeContent";

const HOME_CONTENTS = [
	["백신 제조 홈", VACCINE_HOME],
	["카드 매치 홈", CARD_HOME],
] as const;

describe.each(HOME_CONTENTS)("%s 문구 구성", (_name, content) => {
	test("제목과 부제가 한국어와 영어 모두 비어 있지 않다", () => {
		for (const language of ["ko", "en"] as const) {
			const dictionary = resources[language][content.namespace];
			expect(dictionary.title.accent.trim()).not.toBe("");
			expect(dictionary.title.rest.trim()).not.toBe("");
			expect(dictionary.subtitle.trim()).not.toBe("");
		}
	});

	test("게임 방법은 3단계이고 단계마다 두 언어 설명과 그림이 있다", () => {
		expect(content.stepMedia).toHaveLength(3);
		for (const language of ["ko", "en"] as const) {
			const { step1, step2, step3 } = resources[language][content.namespace];
			for (const description of [step1, step2, step3]) {
				expect(description.trim()).not.toBe("");
			}
		}
		for (const media of content.stepMedia) {
			expect(media.src).toBeTruthy();
		}
	});

	test("단계 설명이 서로 겹치지 않는다", () => {
		const { step1, step2, step3 } = resources.ko[content.namespace];
		expect(new Set([step1, step2, step3]).size).toBe(3);
	});
});
