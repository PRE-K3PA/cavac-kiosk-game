import imgStepTrophy from "@/assets/images/common/imgStepTrophy.png";
import imgVaccineStepCatch from "@/assets/images/vaccine/imgVaccineStepCatch.png";
import imgVaccineStepMemorize from "@/assets/images/vaccine/imgVaccineStepMemorize.png";
import type { HomeContent } from "@/pages/home/HomeTemplate";

export const VACCINE_HOME = {
	namespace: "vaccineHome",
	stepMedia: [
		{ src: imgVaccineStepMemorize, fit: "contain" },
		{ src: imgVaccineStepCatch, fit: "contain" },
		{ src: imgStepTrophy, fit: "contain" },
	],
} satisfies HomeContent;
