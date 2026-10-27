import { create, type StoreApi } from "zustand";
import type { Language } from "@/types/data";

// 방문자 한 명이 쓰는 동안만 유지하는 설정. 파일이나 localStorage 에 저장하지 않습니다

const DEFAULT_SESSION = {
	language: "ko",
	isMuted: false,
} as const satisfies { language: Language; isMuted: boolean };

type SessionState = {
	language: Language;
	isMuted: boolean;
	setLanguage: (language: Language) => void;
	toggleLanguage: () => void;
	toggleMute: () => void;
	/** 홈으로 돌아올 때 부릅니다. 언어는 앞 화면에서 고른 그대로 둡니다 */
	resetMute: () => void;
	reset: () => void;
};

function createSessionState(set: StoreApi<SessionState>["setState"]): SessionState {
	function setLanguage(language: Language) {
		set({ language });
	}

	function toggleLanguage() {
		set((s) => ({ language: s.language === "ko" ? "en" : "ko" }));
	}

	function toggleMute() {
		set((s) => ({ isMuted: !s.isMuted }));
	}

	function resetMute() {
		set({ isMuted: DEFAULT_SESSION.isMuted });
	}

	function reset() {
		set(DEFAULT_SESSION);
	}

	return { ...DEFAULT_SESSION, setLanguage, toggleLanguage, toggleMute, resetMute, reset };
}

export const useSessionStore = create<SessionState>()(createSessionState);
