import type ko from "@/i18n/locales/ko/cardGame";

export default {
	memorize: {
		title: "Memorize\nthe cards!",
		message: "The cards will flip soon,\nthen the game begins.",
	},
	// 숫자 바로 뒤에 붙어 나오므로 앞 공백이 띄어쓰기입니다. 지우면 "3pairs" 가 됩니다
	matchedLabel: " pairs\nfound!",
	score: "SCORE",
	time: "{{seconds}}s",
	cardLabel: "Card {{n}}",
	result: {
		title: "Results",
		unit: " pts",
		subtitle: "Take another look at the products in the game!",
		carouselLabel: "Products in the game",
		prev: "Previous",
		next: "Next",
		home: "Home",
	},
} satisfies typeof ko;
