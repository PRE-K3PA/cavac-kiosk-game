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
	toggleLanguage: () => void;
	toggleMute: () => void;
	/** 다음 관람객을 위한 대기 상태로 돌아갈 때 부릅니다 */
	reset: () => void;
};

function createSessionState(set: StoreApi<SessionState>["setState"]): SessionState {
	function toggleLanguage() {
		set((s) => ({ language: s.language === "ko" ? "en" : "ko" }));
	}

	function toggleMute() {
		set((s) => ({ isMuted: !s.isMuted }));
	}

	function reset() {
		set(DEFAULT_SESSION);
	}

	return { ...DEFAULT_SESSION, toggleLanguage, toggleMute, reset };
}

export const useSessionStore = create<SessionState>()(createSessionState);
