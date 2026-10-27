import imgCardStepMatch from "@/assets/images/card/imgCardStepMatch.png";
import imgCardStepMemorize from "@/assets/images/card/imgCardStepMemorize.png";
import imgStepTrophy from "@/assets/images/common/imgStepTrophy.png";
import type { HomeContent } from "@/pages/home/HomeTemplate";

export const CARD_HOME = {
	namespace: "cardHome",
	stepMedia: [imgCardStepMemorize, imgCardStepMatch, imgStepTrophy],
} satisfies HomeContent;
