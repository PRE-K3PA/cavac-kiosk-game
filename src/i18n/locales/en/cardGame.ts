import type ko from "@/i18n/locales/ko/cardGame";

export default {
	memorize: {
		title: "Memorize\nthe cards!",
		message: "The cards will flip soon,\nthen the game begins.",
	},
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
