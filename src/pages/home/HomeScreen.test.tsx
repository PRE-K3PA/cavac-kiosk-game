/// <reference path="../../vite-env.d.ts" />
/// <reference path="../../../electron/preload/api.ts" />
import { afterEach, beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { OrientationProvider } from "@/layout/OrientationContext";
import type { Orientation } from "@/layout/stage";
import CardHome from "@/pages/card/CardHome";
import type { HomeScreenProps } from "@/pages/home/HomeTemplate";
import VaccineHome from "@/pages/vaccine/VaccineHome";
import { useSessionStore } from "@/store/sessionStore";

const HOMES = [
	{ name: "백신 제조 홈", Home: VaccineHome, koTitle: "백신 제조", enTitle: "Vaccine" },
	{ name: "카드 매치 홈", Home: CardHome, koTitle: "카드 매치", enTitle: "Card" },
];

const ORIENTATIONS: Orientation[] = ["landscape", "portrait"];

function renderHome(
	Home: (props: HomeScreenProps) => ReactNode,
	orientation: Orientation = "landscape",
) {
	const onStart = mock(() => {});
	const onAdminActivate = mock(() => {});
	const view = render(
		<OrientationProvider orientation={orientation}>
			<Home onStart={onStart} onAdminActivate={onAdminActivate} />
		</OrientationProvider>,
	);
	return { ...view, onStart, onAdminActivate };
}

afterEach(() => {
	cleanup();
	useSessionStore.getState().reset();
});

describe.each(HOMES)("$name", ({ Home, koTitle, enTitle }) => {
	test("처음에는 한국어 제목과 시작하기 버튼이 보인다", () => {
		renderHome(Home);
		expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(koTitle);
		expect(screen.getByRole("button", { name: "시작하기" })).toBeTruthy();
	});

	test("앞 관람객이 바꾼 언어와 음소거는 홈이 나타날 때 기본값으로 돌아간다", () => {
		useSessionStore.getState().toggleLanguage();
		useSessionStore.getState().toggleMute();

		renderHome(Home);

		expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(koTitle);
		expect(useSessionStore.getState().isMuted).toBe(false);
	});

	test("언어 버튼을 누르면 영어 제목과 Start 버튼으로 바뀐다", () => {
		renderHome(Home);
		fireEvent.click(screen.getByRole("button", { name: "언어 변경" }));

		expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(enTitle);
		expect(screen.getByRole("button", { name: "Start" })).toBeTruthy();
		expect(screen.queryByRole("button", { name: "시작하기" })).toBeNull();
	});

	test("시작 버튼을 누르면 onStart 가 한 번 불린다", () => {
		const { onStart } = renderHome(Home);
		fireEvent.click(screen.getByRole("button", { name: "시작하기" }));
		expect(onStart).toHaveBeenCalledTimes(1);
	});

	test("방향을 정해 주지 않으면 가로로 그린다", () => {
		const { container } = render(<Home onStart={() => {}} onAdminActivate={() => {}} />);
		expect(container.querySelector("header")?.className).toContain("h-28.5");
	});

	test.each(ORIENTATIONS)("%s 방향에서도 게임 방법 3단계가 렌더된다", (orientation) => {
		renderHome(Home, orientation);
		expect(screen.getByRole("heading", { level: 2 }).textContent).toBe("게임 방법");
		for (const step of ["1", "2", "3"]) {
			expect(screen.getByText(step)).toBeTruthy();
		}
	});

	test.each([
		["landscape", "h-28.5"],
		["portrait", "h-40"],
	] as const)("%s 방향이면 헤더 높이가 %s 이다", (orientation, headerHeight) => {
		const { container } = renderHome(Home, orientation);
		expect(container.querySelector("header")?.className).toContain(headerHeight);
	});
});

describe("관리자 핫스팟", () => {
	beforeEach(() => {
		jest.useFakeTimers();
	});

	afterEach(() => {
		jest.useRealTimers();
	});

	function findHotspot(container: HTMLElement): Element {
		const hotspot = container.querySelector("[data-state]");
		if (!hotspot) throw new Error("관리자 핫스팟을 찾지 못했습니다");
		return hotspot;
	}

	test("짧게 누르면 onAdminActivate 가 불리지 않는다", () => {
		const { container, onAdminActivate } = renderHome(VaccineHome);
		const hotspot = findHotspot(container);

		fireEvent.pointerDown(hotspot);
		act(() => jest.advanceTimersByTime(500));
		fireEvent.pointerUp(hotspot);

		expect(onAdminActivate).not.toHaveBeenCalled();
	});

	test.each(ORIENTATIONS)("%s 방향에서도 핫스팟은 200x200 이다", (orientation) => {
		const { container } = renderHome(VaccineHome, orientation);
		expect(findHotspot(container).className).toContain("size-50");
	});

	test("1.5초 이상 길게 누른 뒤 떼면 onAdminActivate 가 불린다", () => {
		const { container, onAdminActivate } = renderHome(VaccineHome);
		const hotspot = findHotspot(container);

		fireEvent.pointerDown(hotspot);
		act(() => jest.advanceTimersByTime(1600));
		expect(onAdminActivate).not.toHaveBeenCalled();
		fireEvent.pointerUp(hotspot);

		expect(onAdminActivate).toHaveBeenCalledTimes(1);
	});
});
