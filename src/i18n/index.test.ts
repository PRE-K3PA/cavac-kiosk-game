import { beforeEach, describe, expect, test } from "bun:test";
import i18next from "@/i18n";
import { useSessionStore } from "@/store/sessionStore";

beforeEach(() => useSessionStore.getState().reset());

describe("i18n 언어 동기화", () => {
	test("setLanguage 로 언어를 바꾸면 i18next 언어도 따라간다", () => {
		useSessionStore.getState().setLanguage("en");
		expect(i18next.language).toBe("en");
	});

	test("영어로 바꾼 뒤 reset 하면 i18next 언어도 ko 로 돌아온다", () => {
		useSessionStore.getState().setLanguage("en");
		expect(i18next.language).toBe("en");

		useSessionStore.getState().reset();

		expect(i18next.language).toBe("ko");
	});
});
