import imgCardStepMatch from "@/assets/images/card/imgCardStepMatch.png";
import imgCardStepMemorize from "@/assets/images/card/imgCardStepMemorize.png";
import imgStepTrophy from "@/assets/images/common/imgStepTrophy.png";
import type { HomeContent } from "@/pages/home/HomeTemplate";

export const CARD_HOME = {
	title: {
		ko: { accent: "카드 매치", rest: "게임" },
		en: { accent: "Card", rest: "Match" },
	},
	subtitle: {
		ko: "같은 카드를 찾아 짝을 맞춰보세요.",
		en: "Find the matching cards and make pairs.",
	},
	steps: [
		{
			description: { ko: "카드의 위치를 기억해요.", en: "Memorize where the cards are." },
			media: { src: imgCardStepMemorize, fit: "contain" },
		},
		{
			description: { ko: "같은 카드끼리 짝지어요.", en: "Match identical cards." },
			media: { src: imgCardStepMatch, fit: "cover" },
		},
		{
			description: {
				ko: "빠르게 많이 맞출수록 유리해요!",
				en: "Faster matches, higher score!",
			},
			media: { src: imgStepTrophy, fit: "contain" },
		},
	],
} satisfies HomeContent;
