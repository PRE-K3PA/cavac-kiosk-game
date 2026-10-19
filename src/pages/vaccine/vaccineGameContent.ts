import type { Localized } from "@/types/data";

export type GameLanguage = keyof Localized<string>;

export const VACCINE_GAME_COPY = {
	recipeTitle: {
		ko: "아래 백신의 항원을 기억해주세요!",
		en: "Remember the antigens below!",
	},
	countdownBefore: { ko: "게임 시작까지 ", en: "Game starts in " },
	countdownAfter: { ko: "초", en: "s" },
	countdownLabel: { ko: "게임 시작까지 남은 시간", en: "Time until the game starts" },
	score: { ko: "SCORE", en: "SCORE" },
	completed: { ko: "완성된 백신", en: "Vaccines Made" },
	bottleLabel: { ko: "백신 병", en: "Vaccine bottle" },
	resultTitle: { ko: "백신 제조 완료!", en: "Vaccines Complete!" },
	// 클라이언트가 문구를 전달하기 전까지 쓰는 임시 문구
	resultEncourage: { ko: "조금 더 노력해보세요!", en: "Give it another try!" },
	scoreUnit: { ko: "점", en: " pts" },
	resultSubtitle: {
		ko: "게임 속 백신을 다시 한 번 확인해보세요!",
		en: "Take another look at the vaccines in the game!",
	},
	carouselLabel: { ko: "게임 속 백신", en: "Vaccines in the game" },
	previousVaccine: { ko: "이전 백신", en: "Previous vaccine" },
	nextVaccine: { ko: "다음 백신", en: "Next vaccine" },
	home: { ko: "처음으로", en: "Home" },
} satisfies Record<string, Localized<string>>;

export function formatSeconds(seconds: number, language: GameLanguage): string {
	return language === "ko" ? `${seconds}초` : `${seconds}s`;
}

export function formatCount(count: number, language: GameLanguage): string {
	return language === "ko" ? `${count}개` : String(count);
}

export function formatScore(score: number): string {
	return score.toLocaleString("en-US");
}

export function formatCombo(combo: number, language: GameLanguage): string {
	return language === "ko" ? `${combo} 콤보!` : `${combo} COMBO!`;
}

export function formatMissingAntigen(label: string, language: GameLanguage): string {
	return language === "ko" ? `${label}가 필요해요!` : `We need ${label}!`;
}
