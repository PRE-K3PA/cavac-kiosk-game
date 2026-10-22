/// <reference path="../../vite-env.d.ts" />
/// <reference path="../../../electron/preload/api.ts" />
import { afterEach, beforeEach, describe, expect, jest, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as storage from "@/data/storage";
import { CARD_FLIP_MS } from "@/features/card-game/utils/cardRules";
import type { Orientation } from "@/layout/stage";
import { useSessionStore } from "@/store/sessionStore";
import type { CardGameData, PairCount, ProductSlot } from "@/types/data";

const PLAY_SECONDS = 10;

function products(count: number): ProductSlot[] {
	return Array.from({ length: count }, (_, index) => ({
		slot: index + 1,
		image: { ko: `images/ko/${index + 1}.png`, en: `images/en/${index + 1}.png` },
		isEnabled: true,
		isShownInResult: true,
	}));
}

function cardGameData(pairCount: PairCount, slots: ProductSlot[]): CardGameData {
	return {
		settings: {
			pairCount,
			penalty: {
				time: { isEnabled: false, seconds: 3 },
				score: { isEnabled: false, points: 50 },
			},
		},
		products: slots,
	};
}

let stored = cardGameData(8, products(12));

const getData = mock(async (file: string) => {
	if (file === "card-game") return stored;
	return { playDurationSeconds: PLAY_SECONDS };
});

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getData,
	getImageUrl: (path: string) => `file://${path}`,
}));

const { OrientationProvider } = await import("@/layout/OrientationContext");
const { default: CardGame } = await import("@/pages/card/CardGame");

async function renderGame(orientation: Orientation = "landscape") {
	const onExit = mock(() => {});
	const onAdminActivate = mock(() => {});
	const view = render(
		<OrientationProvider orientation={orientation}>
			<CardGame onExit={onExit} onAdminActivate={onAdminActivate} />
		</OrientationProvider>,
	);
	await act(async () => {});
	return { ...view, onExit, onAdminActivate };
}

function advance(ms: number) {
	act(() => {
		jest.advanceTimersByTime(ms);
	});
}

function startPlaying() {
	advance(3000);
	advance(CARD_FLIP_MS);
}

function finishGame() {
	startPlaying();
	advance(PLAY_SECONDS * 1000 + 500);
}

function cards() {
	return screen.getAllByRole("button", { name: /^(카드|Card) \d+$/ });
}

function board(container: HTMLElement) {
	const grid = container.querySelector(".grid");
	if (!grid) throw new Error("카드판을 찾지 못했습니다");
	return grid;
}

beforeEach(() => {
	jest.useFakeTimers();
	stored = cardGameData(8, products(12));
});

afterEach(() => {
	cleanup();
	jest.useRealTimers();
	useSessionStore.getState().reset();
});

describe("흐름", () => {
	test("안내 카운트다운 후 카드가 뒤집히고, 시간이 끝나면 결과가 나온다", async () => {
		const { container } = await renderGame();

		expect(screen.getByText(/카드 위치를/)).toBeTruthy();
		expect(screen.getByText("3")).toBeTruthy();
		expect(cards().every((card) => card.getAttribute("aria-pressed") === "true")).toBe(true);
		expect(screen.queryByRole("progressbar")).toBeNull();

		advance(1000);
		expect(screen.getByText("2")).toBeTruthy();
		advance(2000);

		// 뒤집히는 동안은 안내 패널이 그대로이고 숫자만 숨겨진다
		expect(screen.getByText(/카드 위치를/)).toBeTruthy();
		expect(screen.queryByText("1")).toBeNull();
		expect(screen.queryByRole("progressbar")).toBeNull();
		expect(screen.queryByText("SCORE")).toBeNull();
		expect(cards().every((card) => card.getAttribute("aria-pressed") === "false")).toBe(true);

		advance(CARD_FLIP_MS);
		expect(screen.queryByText(/카드 위치를/)).toBeNull();
		expect(screen.getByRole("progressbar")).toBeTruthy();
		expect(screen.getByText("10초")).toBeTruthy();
		expect(screen.getByText("SCORE")).toBeTruthy();
		expect(screen.getByText(/쌍을/)).toBeTruthy();
		expect(container.querySelector("h1")).toBeNull();

		advance(PLAY_SECONDS * 1000 + 500);
		expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("게임 결과");
	});

	test("뒤집히는 동안 안내 말풍선은 그대로이고 숫자 자리에는 글자가 보이지 않는다", async () => {
		const { container } = await renderGame();
		advance(3000);

		const count = container.querySelector(".typo-number-xl");
		expect(count).toBeTruthy();
		expect(count?.textContent?.trim()).toBe("");
		expect(container.textContent).not.toContain("00A0");
		expect(screen.getByText(/카드 위치를/)).toBeTruthy();
	});

	test("안내 중에는 카드를 눌러도 아무 일도 없다", async () => {
		await renderGame();
		fireEvent.click(cards()[0]);
		advance(3000);
		expect(cards()[0].getAttribute("aria-pressed")).toBe("false");
	});

	test("결과의 처음으로 버튼에서만 onExit 가 불린다", async () => {
		const { onExit } = await renderGame();
		startPlaying();
		expect(onExit).not.toHaveBeenCalled();
		advance(PLAY_SECONDS * 1000 + 500);

		fireEvent.click(screen.getByRole("button", { name: "처음으로" }));
		expect(onExit).toHaveBeenCalledTimes(1);
	});

	test("같은 카드 두 장을 맞추면 점수와 맞춘 쌍 수가 오른다", async () => {
		await renderGame();
		startPlaying();

		const bySrc: Record<string, HTMLElement[]> = {};
		for (const card of cards()) {
			const src = card.querySelector("img[src^='file://']")?.getAttribute("src") ?? "";
			bySrc[src] = [...(bySrc[src] ?? []), card];
		}
		const [first, second] = Object.values(bySrc).find((group) => group.length === 2) ?? [];
		if (!first || !second) throw new Error("짝을 찾지 못했습니다");
		fireEvent.click(first);
		fireEvent.click(second);
		advance(CARD_FLIP_MS);

		expect(screen.getByText("100")).toBeTruthy();
		expect(screen.getByText("1")).toBeTruthy();
	});
});

describe("카드판 배치", () => {
	test.each([
		["landscape", 4, 8, "grid-cols-4", "w-74"],
		["landscape", 8, 16, "grid-cols-4", "w-40.75"],
		["landscape", 12, 24, "grid-cols-6", "w-40.75"],
		["portrait", 4, 8, "grid-cols-2", "w-59"],
		["portrait", 8, 16, "grid-cols-4", "w-59"],
		["portrait", 12, 24, "grid-cols-4", "w-37.75"],
	] as const)(
		"%s %i쌍은 카드 %i장, %s, %s",
		async (orientation, pairCount, total, columns, width) => {
			stored = cardGameData(pairCount, products(12));
			const { container } = await renderGame(orientation);

			expect(cards()).toHaveLength(total);
			expect(board(container).className).toContain(columns);
			expect(cards()[0].className).toContain(width);
		},
	);

	test("안내와 게임의 카드판 위치와 크기는 같다", async () => {
		const { container } = await renderGame("portrait");
		const preview = board(container).parentElement?.className;
		advance(3000);
		expect(board(container).parentElement?.className).toBe(preview);
	});
});

describe("언어와 제품 이미지", () => {
	test("영어로 바꾸면 안내 문구와 제품 이미지가 영어로 바뀐다", async () => {
		await renderGame();
		expect(cards()[0].querySelector("img[src^='file://images/ko/']")).toBeTruthy();

		act(() => useSessionStore.getState().setLanguage("en"));

		expect(screen.getByText(/Memorize/)).toBeTruthy();
		expect(cards()[0].getAttribute("aria-label")).toStartWith("Card ");
		expect(cards()[0].querySelector("img[src^='file://images/en/']")).toBeTruthy();
	});

	test("카드 뒷면 로고는 한국어에서는 한글 로고, 영어에서는 영문 로고다", async () => {
		const logoSrc = () => cards()[0].querySelector("img.opacity-50")?.getAttribute("src");
		await renderGame();
		const koLogo = logoSrc();
		expect(koLogo).toContain("imgMemoryLogo");
		expect(koLogo).not.toContain("imgMemoryLogoEn");

		act(() => useSessionStore.getState().setLanguage("en"));

		expect(logoSrc()).toContain("imgMemoryLogoEn");
	});

	test("영어 결과는 Results 와 pts 로 나오고 제품 이미지가 영어다", async () => {
		useSessionStore.getState().setLanguage("en");
		const { container } = await renderGame();
		finishGame();

		expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Results");
		expect(screen.getByText("pts")).toBeTruthy();
		expect(screen.getByText("pts").className).toContain("text-accent-sky-blue");
		expect(screen.getByRole("button", { name: "Home" })).toBeTruthy();
		expect(container.querySelector("img[src^='file://images/en/']")).toBeTruthy();
	});

	test("한국어 결과는 점수 뒤에 점이 붙는다", async () => {
		await renderGame();
		finishGame();
		expect(screen.getByText("점")).toBeTruthy();
		expect(screen.getByRole("button", { name: "이전" })).toBeTruthy();
	});
});

describe("제품이 부족하거나 없을 때", () => {
	test("제품 이미지가 하나도 없어도 한 판이 끝까지 렌더된다", async () => {
		stored = cardGameData(
			8,
			products(12).map((slot) => ({ ...slot, image: null })),
		);
		await renderGame();
		expect(cards()).toHaveLength(16);

		finishGame();
		expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("게임 결과");
		expect(screen.queryByRole("region", { name: "게임 속 제품" })).toBeNull();
		expect(screen.getByRole("button", { name: "처음으로" })).toBeTruthy();
	});

	test("켜진 제품이 모자라도 정해진 장수로 렌더된다", async () => {
		stored = cardGameData(12, products(2));
		await renderGame("portrait");
		expect(cards()).toHaveLength(24);
	});

	test("자리표시 카드 앞면은 언어에 맞는 공용 로고다", async () => {
		const faceSrcs = () =>
			cards()
				.map((card) => card.querySelector("img:not(.opacity-50)")?.getAttribute("src") ?? "")
				.filter((src) => !src.startsWith("file://"));
		stored = cardGameData(4, products(2));
		await renderGame();
		expect(faceSrcs()).toHaveLength(4);
		expect(faceSrcs().every((src) => src.includes("imgLogoKo"))).toBe(true);

		act(() => useSessionStore.getState().setLanguage("en"));

		expect(faceSrcs().every((src) => src.includes("imgLogoEn"))).toBe(true);
	});
});

function hasBackground(container: HTMLElement) {
	return container.querySelector("img[src*='imgGameBackground']") !== null;
}

describe("배경", () => {
	test("안내, 플레이, 결과 화면에 게임 배경이 깔린다", async () => {
		const { container } = await renderGame();
		expect(hasBackground(container)).toBe(true);

		advance(3000);
		advance(CARD_FLIP_MS);
		expect(hasBackground(container)).toBe(true);

		advance(PLAY_SECONDS * 1000 + 500);
		expect(screen.getByRole("heading", { level: 1 })).toBeTruthy();
		expect(hasBackground(container)).toBe(true);
	});
});

describe("설정을 읽는 동안", () => {
	test("빈 화면이지만 관리자 핫스팟은 있다", () => {
		const { container } = render(
			<OrientationProvider orientation="landscape">
				<CardGame onExit={() => {}} onAdminActivate={() => {}} />
			</OrientationProvider>,
		);
		expect(screen.queryAllByRole("button")).toHaveLength(0);
		expect(container.querySelector("[data-state]")).toBeTruthy();
		expect(hasBackground(container)).toBe(true);
	});
});

describe("저장 데이터 읽기가 통째로 실패하면", () => {
	test("기본값으로 한 판을 그린다", async () => {
		getData.mockImplementationOnce(async () => {
			throw new Error("disk");
		});
		getData.mockImplementationOnce(async () => {
			throw new Error("disk");
		});
		await renderGame();
		expect(cards()).toHaveLength(16);
	});
});
