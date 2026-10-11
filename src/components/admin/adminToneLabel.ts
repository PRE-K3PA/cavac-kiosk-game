export const ADMIN_TONE_LABEL = {
	common: "공통 설정",
	vaccine: "백신 제조 게임",
	card: "카드 매치 게임",
} as const;

export type AdminTone = keyof typeof ADMIN_TONE_LABEL;
