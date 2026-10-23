import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import HomeButton from "@/components/common/HomeButton";
import LanguageButton from "@/components/common/LanguageButton";
import ResultCarousel from "@/components/common/ResultCarousel";
import SoundButton from "@/components/common/SoundButton";
import StartButton from "@/components/common/StartButton";
import { useSessionStore } from "@/store/sessionStore";
import * as engine from "@/utils/soundEngine";

let played: engine.SoundName[] = [];
let playSpy: ReturnType<typeof spyOn<typeof engine, "playSound">>;

beforeEach(() => {
	played = [];
	playSpy = spyOn(engine, "playSound").mockImplementation((name) => {
		played.push(name);
	});
});

afterEach(() => {
	cleanup();
	playSpy.mockRestore();
	useSessionStore.getState().reset();
});

const SLIDES = [
	{ id: "a", content: "A" },
	{ id: "b", content: "B" },
];

function renderCarousel(slides = SLIDES) {
	return render(
		<ResultCarousel
			label="제품"
			slides={slides}
			index={0}
			onIndexChange={() => {}}
			arrowLabels={{ prev: "이전", next: "다음" }}
		/>,
	);
}

describe("HomeButton 효과음", () => {
	test("누르면 button 소리가 나고 onClick 도 호출된다", () => {
		let clicks = 0;
		const view = render(<HomeButton label="처음으로" onClick={() => clicks++} />);

		fireEvent.click(view.getByRole("button", { name: "처음으로" }));

		expect(played).toEqual(["button"]);
		expect(clicks).toBe(1);
	});

	test("음소거면 소리가 나지 않고 onClick 은 호출된다", () => {
		useSessionStore.getState().toggleMute();
		let clicks = 0;
		const view = render(<HomeButton label="처음으로" onClick={() => clicks++} />);

		fireEvent.click(view.getByRole("button", { name: "처음으로" }));

		expect(played).toEqual([]);
		expect(clicks).toBe(1);
	});
});

describe("LanguageButton 효과음", () => {
	test("누르면 button 소리가 나고 onClick 도 호출된다", () => {
		let clicks = 0;
		const view = render(<LanguageButton label="언어" onClick={() => clicks++} />);

		fireEvent.click(view.getByRole("button", { name: "언어" }));

		expect(played).toEqual(["button"]);
		expect(clicks).toBe(1);
	});

	test("음소거면 소리가 나지 않고 onClick 은 호출된다", () => {
		useSessionStore.getState().toggleMute();
		let clicks = 0;
		const view = render(<LanguageButton label="언어" onClick={() => clicks++} />);

		fireEvent.click(view.getByRole("button", { name: "언어" }));

		expect(played).toEqual([]);
		expect(clicks).toBe(1);
	});
});

describe("SoundButton 효과음", () => {
	test("소리를 켤 때 button 소리가 나고 onClick 도 호출된다", () => {
		let clicks = 0;
		const view = render(<SoundButton label="소리" muted onClick={() => clicks++} />);

		fireEvent.click(view.getByRole("button", { name: "소리" }));

		expect(played).toEqual(["button"]);
		expect(clicks).toBe(1);
	});

	test("소리를 끌 때는 소리가 나지 않고 onClick 은 호출된다", () => {
		let clicks = 0;
		const view = render(<SoundButton label="소리" onClick={() => clicks++} />);

		fireEvent.click(view.getByRole("button", { name: "소리" }));

		expect(played).toEqual([]);
		expect(clicks).toBe(1);
	});
});

describe("StartButton 효과음", () => {
	test("누르면 start 소리가 나고 onClick 도 호출된다", () => {
		let clicks = 0;
		const view = render(<StartButton label="시작하기" onClick={() => clicks++} />);

		fireEvent.click(view.getByRole("button", { name: "시작하기" }));

		expect(played).toEqual(["start"]);
		expect(clicks).toBe(1);
	});

	test("음소거면 소리가 나지 않고 onClick 은 호출된다", () => {
		useSessionStore.getState().toggleMute();
		let clicks = 0;
		const view = render(<StartButton label="시작하기" onClick={() => clicks++} />);

		fireEvent.click(view.getByRole("button", { name: "시작하기" }));

		expect(played).toEqual([]);
		expect(clicks).toBe(1);
	});

	test("비활성이면 소리도 onClick 도 없다", () => {
		let clicks = 0;
		const view = render(<StartButton label="시작하기" state="disabled" onClick={() => clicks++} />);

		fireEvent.click(view.getByRole("button", { name: "시작하기" }));

		expect(played).toEqual([]);
		expect(clicks).toBe(0);
	});
});

describe("ResultCarousel 효과음", () => {
	test("화살표로 넘기면 button 소리가 한 번 난다", () => {
		const view = renderCarousel();

		fireEvent.click(view.getByRole("button", { name: "다음" }));

		expect(played).toEqual(["button"]);
	});

	test("넘길 수 없으면 소리가 나지 않는다", () => {
		const view = renderCarousel([SLIDES[0]]);

		fireEvent.click(view.getByRole("button", { name: "다음" }));

		expect(played).toEqual([]);
	});
});
