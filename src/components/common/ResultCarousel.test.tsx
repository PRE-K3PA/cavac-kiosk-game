import { afterEach, beforeEach, describe, expect, jest, mock, spyOn, test } from "bun:test";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import ResultCarousel from "@/components/common/ResultCarousel";
import * as engine from "@/utils/soundEngine";

const SLIDES = [
	{ id: "a", content: "A" },
	{ id: "b", content: "B" },
	{ id: "c", content: "C" },
];

let playSpy: ReturnType<typeof spyOn<typeof engine, "playSound">>;

beforeEach(() => {
	jest.useFakeTimers();
	playSpy = spyOn(engine, "playSound").mockImplementation(() => {});
});

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	playSpy.mockRestore();
});

function renderCarousel({
	slides = SLIDES,
	index = 0,
	autoAdvance = true,
	onIndexChange = mock((_: number) => {}),
} = {}) {
	const view = render(
		<ResultCarousel
			label="제품"
			slides={slides}
			index={index}
			onIndexChange={onIndexChange}
			autoAdvance={autoAdvance}
			arrowLabels={{ prev: "이전", next: "다음" }}
		/>,
	);
	return { ...view, onIndexChange };
}

function advance(ms: number) {
	act(() => {
		jest.advanceTimersByTime(ms);
	});
}

describe("ResultCarousel 자동 넘김", () => {
	test("2초가 지나면 소리 없이 다음 슬라이드로 넘긴다", () => {
		const { onIndexChange } = renderCarousel();

		advance(1999);
		expect(onIndexChange).not.toHaveBeenCalled();
		advance(1);
		expect(onIndexChange).toHaveBeenCalledWith(1);
		expect(playSpy).not.toHaveBeenCalled();
	});

	test("마지막 슬라이드 다음은 처음으로 돌아간다", () => {
		const { onIndexChange } = renderCarousel({ index: 2 });

		advance(2000);
		expect(onIndexChange).toHaveBeenCalledWith(0);
	});

	test("직접 넘기면 그때부터 다시 2초를 센다", () => {
		const { onIndexChange, getByRole, rerender } = renderCarousel();

		advance(1000);
		fireEvent.click(getByRole("button", { name: "다음" }));
		expect(onIndexChange).toHaveBeenLastCalledWith(1);
		rerender(
			<ResultCarousel
				label="제품"
				slides={SLIDES}
				index={1}
				onIndexChange={onIndexChange}
				autoAdvance
				arrowLabels={{ prev: "이전", next: "다음" }}
			/>,
		);

		advance(1000);
		expect(onIndexChange).toHaveBeenCalledTimes(1);
		advance(1000);
		expect(onIndexChange).toHaveBeenLastCalledWith(2);
	});

	test("슬라이드가 하나면 넘기지 않는다", () => {
		const { onIndexChange } = renderCarousel({ slides: [SLIDES[0]] });

		advance(10000);
		expect(onIndexChange).not.toHaveBeenCalled();
	});

	test("autoAdvance 를 켜지 않으면 넘기지 않는다", () => {
		const { onIndexChange } = renderCarousel({ autoAdvance: false });

		advance(10000);
		expect(onIndexChange).not.toHaveBeenCalled();
	});

	test("화면이 사라지면 타이머가 남지 않는다", () => {
		const { onIndexChange, unmount } = renderCarousel();

		unmount();
		advance(10000);
		expect(onIndexChange).not.toHaveBeenCalled();
	});
});
