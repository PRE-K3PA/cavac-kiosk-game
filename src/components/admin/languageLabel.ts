import type { Language } from "@/types/data";

export const LANGUAGE_LABEL = {
	ko: "KR",
	en: "EN",
} as const satisfies Record<Language, string>;

/** KR·EN 칸을 이 차례로 그립니다 */
export const LANGUAGE_OPTIONS = [
	{ key: "ko", label: LANGUAGE_LABEL.ko },
	{ key: "en", label: LANGUAGE_LABEL.en },
] as const satisfies readonly { key: Language; label: string }[];

export type LanguageOption = (typeof LANGUAGE_OPTIONS)[number];
