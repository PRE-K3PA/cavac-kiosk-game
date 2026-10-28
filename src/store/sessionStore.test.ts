import { beforeEach, describe, expect, test } from "bun:test";
import { useSessionStore } from "@/store/sessionStore";

beforeEach(() => useSessionStore.getState().reset());

describe("sessionStore", () => {
	test("처음에는 한국어이고 소리가 켜져 있다", () => {
		const { language, isMuted } = useSessionStore.getState();
		expect(language).toBe("ko");
		expect(isMuted).toBe(false);
	});

	test("setLanguage 로 언어를 정한다", () => {
		useSessionStore.getState().setLanguage("en");
		expect(useSessionStore.getState().language).toBe("en");
	});

	test("toggleLanguage 는 한국어와 영어를 오간다", () => {
		useSessionStore.getState().toggleLanguage();
		expect(useSessionStore.getState().language).toBe("en");
		useSessionStore.getState().toggleLanguage();
		expect(useSessionStore.getState().language).toBe("ko");
	});

	test("언어와 음소거를 바꾼 뒤 reset 하면 둘 다 기본값으로 돌아온다", () => {
		useSessionStore.getState().setLanguage("en");
		useSessionStore.getState().toggleMute();
		expect(useSessionStore.getState().isMuted).toBe(true);

		useSessionStore.getState().reset();

		expect(useSessionStore.getState().language).toBe("ko");
		expect(useSessionStore.getState().isMuted).toBe(false);
	});
});
