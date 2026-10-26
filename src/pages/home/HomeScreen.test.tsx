/// <reference path="../../vite-env.d.ts" />
/// <reference path="../../../electron/preload/api.ts" />
import { afterEach, beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { createDefaultData } from "@/data/defaults";
import * as storage from "@/data/storage";
import { OrientationProvider } from "@/layout/OrientationContext";
import type { Orientation } from "@/layout/stage";
import { CARD_HOME } from "@/pages/card/cardHomeContent";
import type { HomeScreenProps } from "@/pages/home/HomeTemplate";
import { useSessionStore } from "@/store/sessionStore";
import type { CardGameData, DataFile, VaccineGameData } from "@/types/data";

// 테스트 환경에는 Electron 이 없으므로, 읽기 성공과 실패를 테스트가 직접 정합니다
let stored: Partial<Record<DataFile, unknown>> = {};
let isReadFailing = false;
let readFiles: DataFile[] = [];

async function getStoredData(file: DataFile): Promise<unknown> {
	readFiles.push(file);
	if (isReadFailing || !(file in stored)) throw new Error("읽기 실패");
	return stored[file];
}

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getData: getStoredData,
	getImageUrl: (path: string) => `file://${path}`,
}));

const { default: CardHome } = await import("@/pages/card/CardHome");
const { default: HomeTemplate } = await import("@/pages/home/HomeTemplate");
const { default: VaccineHome } = await import("@/pages/vaccine/VaccineHome");

const IMAGE = { ko: "images/product/ko.png", en: "images/product/en.png" };

function startableCardGame(): CardGameData {
	const data = createDefaultData("card-game");
	return {
		settings: { ...data.settings, pairCount: 4 },
		products: data.products.map((product, index) => ({
			...product,
			image: IMAGE,
			isEnabled: index < 4,
		})),
	};
}

function startableVaccineGame(): VaccineGameData {
	return {
		...createDefaultData("vaccine-game"),
		vaccines: [
			{
				id: "v1",
				brandName: { ko: "브랜드", en: "Brand" },
				productName: { ko: "제품", en: "Product" },
				bottleImage: IMAGE,
				logoImage: IMAGE,
				isEnabled: true,
				antigens: [{ id: "a1", abbr: "ND", subtype: null, pathogenType: "virus", isPinned: false }],
			},
		],
	};
}

const HOMES = [
	{
		name: "백신 제조 홈",
		Home: VaccineHome,
		file: "vaccine-game" as const,
		createStartable: startableVaccineGame,
		koTitle: "백신 제조",
		enTitle: "Vaccine",
	},
	{
		name: "카드 매치 홈",
		Home: CardHome,
		file: "card-game" as const,
		createStartable: startableCardGame,
		koTitle: "카드 매치",
		enTitle: "Card",
	},
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

// 버튼은 처음에 꺼져 있으므로, 게임 데이터 읽기가 끝나고 상태가 반영된 뒤에 확인합니다
async function waitForGameRead(file: DataFile) {
	await waitFor(() => expect(readFiles).toContain(file));
	await act(async () => {});
}

beforeEach(() => {
	stored = {};
	isReadFailing = false;
	readFiles = [];
});

afterEach(() => {
	cleanup();
	useSessionStore.getState().reset();
});

describe.each(HOMES)("$name", ({ Home, file, createStartable, koTitle, enTitle }) => {
	test("처음에는 한국어 제목과 시작하기 버튼이 보인다", () => {
		renderHome(Home);
		expect(screen.getByRole("heading", { level: 1 }).textContent).toContain(koTitle);
		expect(screen.getByRole("button", { name: "시작하기" })).toBeTruthy();
	});

	test("앞 관람객이 바꾼 언어와 음소거는 홈이 나타날 때 기본값으로 돌아간다", () => {
		useSessionStore.getState().setLanguage("en");
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

	test("게임 데이터가 저장 규칙에 맞으면 시작 버튼을 누를 수 있다", async () => {
		stored[file] = createStartable();
		const { onStart } = renderHome(Home);
		const start = screen.getByRole("button", { name: "시작하기" }) as HTMLButtonElement;

		await waitForGameRead(file);
		fireEvent.click(start);

		expect(start.disabled).toBe(false);
		expect(onStart).toHaveBeenCalledTimes(1);
	});

	test("게임 데이터를 읽지 못하면 시작 버튼이 눌리지 않는다", async () => {
		stored[file] = createStartable();
		isReadFailing = true;
		const { onStart } = renderHome(Home);
		const start = screen.getByRole("button", { name: "시작하기" }) as HTMLButtonElement;

		await waitForGameRead(file);
		fireEvent.click(start);

		expect(start.disabled).toBe(true);
		expect(onStart).not.toHaveBeenCalled();
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

describe("HomeTemplate 시작 버튼", () => {
	test("시작할 수 있으면 누를 때 onStart 가 한 번 불린다", () => {
		const onStart = mock(() => {});
		render(<HomeTemplate content={CARD_HOME} onStart={onStart} onAdminActivate={() => {}} />);

		fireEvent.click(screen.getByRole("button", { name: "시작하기" }));

		expect(onStart).toHaveBeenCalledTimes(1);
	});

	test("isStartDisabled 면 눌러도 onStart 가 불리지 않는다", () => {
		const onStart = mock(() => {});
		render(
			<HomeTemplate
				content={CARD_HOME}
				isStartDisabled
				onStart={onStart}
				onAdminActivate={() => {}}
			/>,
		);
		const start = screen.getByRole("button", { name: "시작하기" }) as HTMLButtonElement;

		fireEvent.click(start);

		expect(start.disabled).toBe(true);
		expect(onStart).not.toHaveBeenCalled();
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

	test.each(ORIENTATIONS)("%s 방향에서도 핫스팟은 360x220 이다", (orientation) => {
		const { container } = renderHome(VaccineHome, orientation);
		const { className } = findHotspot(container);
		expect(className).toContain("w-90");
		expect(className).toContain("h-55");
	});

	test("1.5초 동안 누르고 있으면 떼지 않아도 onAdminActivate 가 불린다", () => {
		const { container, onAdminActivate } = renderHome(VaccineHome);
		const hotspot = findHotspot(container);

		fireEvent.pointerDown(hotspot);
		act(() => jest.advanceTimersByTime(1499));
		expect(onAdminActivate).not.toHaveBeenCalled();
		act(() => jest.advanceTimersByTime(1));
		expect(onAdminActivate).toHaveBeenCalledTimes(1);

		fireEvent.pointerUp(hotspot);
		expect(onAdminActivate).toHaveBeenCalledTimes(1);
	});
});
