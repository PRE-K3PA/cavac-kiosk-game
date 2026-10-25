import type ko from "@/i18n/locales/ko/vaccineGame";

export default {
	recipe: {
		title: "Remember the antigens below!",
		// 숫자는 따로 큰 글씨로 그리므로 앞뒤 문구로 나눕니다. 끝 공백을 지우면 숫자와 붙습니다
		countdownBefore: "Game starts in ",
		countdownAfter: "s",
		countdownLabel: "Time until the game starts",
	},
	play: {
		score: "SCORE",
		completed: "Vaccines Made",
		completedCount: "{{n}}",
		bottleLabel: "Vaccine bottle",
		time: "{{seconds}}s",
		combo: "{{combo}} COMBO!",
		missingAntigen: "We need {{label}}!",
	},
	result: {
		title: "Vaccines Complete!",
		encourage: "Give it another try!",
		// 숫자 바로 뒤에 붙어 나오므로 앞 공백이 띄어쓰기입니다. 지우면 "1,200pts" 가 됩니다
		unit: " pts",
		subtitle: "Take another look at the vaccines in the game!",
		carouselLabel: "Vaccines in the game",
		prev: "Previous vaccine",
		next: "Next vaccine",
		home: "Home",
	},
} satisfies typeof ko;
