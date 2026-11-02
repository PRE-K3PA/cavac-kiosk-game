import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import enCardGame from "@/i18n/locales/en/cardGame";
import enCardHome from "@/i18n/locales/en/cardHome";
import enHome from "@/i18n/locales/en/home";
import enVaccineGame from "@/i18n/locales/en/vaccineGame";
import enVaccineHome from "@/i18n/locales/en/vaccineHome";
import koCardGame from "@/i18n/locales/ko/cardGame";
import koCardHome from "@/i18n/locales/ko/cardHome";
import koHome from "@/i18n/locales/ko/home";
import koVaccineGame from "@/i18n/locales/ko/vaccineGame";
import koVaccineHome from "@/i18n/locales/ko/vaccineHome";
import { useSessionStore } from "@/store/sessionStore";

export const resources = {
	ko: {
		home: koHome,
		vaccineHome: koVaccineHome,
		vaccineGame: koVaccineGame,
		cardHome: koCardHome,
		cardGame: koCardGame,
	},
	en: {
		home: enHome,
		vaccineHome: enVaccineHome,
		vaccineGame: enVaccineGame,
		cardHome: enCardHome,
		cardGame: enCardGame,
	},
} as const;

// 사전은 번들에 포함하고 원격으로 불러오지 않습니다. 오프라인에서 돌아야 하기 때문입니다
i18next.use(initReactI18next).init({
	resources,
	lng: useSessionStore.getState().language,
	fallbackLng: "ko",
	defaultNS: "home",
	initAsync: false,
	interpolation: { escapeValue: false },
	react: { useSuspense: false },
});

// 언어의 단일 출처는 sessionStore 입니다. reset() 으로 ko 로 돌아갈 때도 따라갑니다
useSessionStore.subscribe((state, prev) => {
	if (state.language !== prev.language) i18next.changeLanguage(state.language);
});

export default i18next;
