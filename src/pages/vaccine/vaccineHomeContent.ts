import imgStepTrophy from "@/assets/images/common/imgStepTrophy.png";
import imgVaccineStepCatch from "@/assets/images/vaccine/imgVaccineStepCatch.png";
import imgVaccineStepMemorize from "@/assets/images/vaccine/imgVaccineStepMemorize.png";
import type { HomeContent } from "@/pages/home/HomeTemplate";

export const VACCINE_HOME = {
	title: {
		ko: { accent: "백신 제조", rest: "게임" },
		en: { accent: "Vaccine", rest: "Maker" },
	},
	subtitle: {
		ko: "필요한 항원을 모아 백신을 완성해보세요.",
		en: "Collect the right antigens to complete each vaccine.",
	},
	steps: [
		{
			description: { ko: "필요한 항원을 기억해요.", en: "Memorize the antigens you need." },
			media: { src: imgVaccineStepMemorize, fit: "contain" },
		},
		{
			description: {
				ko: "떨어지는 항원 중 필요한 항원만 골라요.",
				en: "Catch only the antigens you need.",
			},
			media: { src: imgVaccineStepCatch, fit: "contain" },
		},
		{
			description: {
				ko: "백신을 많이 완성할수록 유리해요!",
				en: "More vaccines, higher score!",
			},
			media: { src: imgStepTrophy, fit: "contain" },
		},
	],
} satisfies HomeContent;
