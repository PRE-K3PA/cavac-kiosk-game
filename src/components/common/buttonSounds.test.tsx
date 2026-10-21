import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { cleanup, fireEvent, render } from "@testing-library/react";
import HomeButton from "@/components/common/HomeButton";
import ResultCarousel from "@/components/common/ResultCarousel";
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
