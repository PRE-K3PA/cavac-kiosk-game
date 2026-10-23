/// <reference path="../../../electron/preload/api.ts" />
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { createDefaultData } from "@/data/defaults";
import type { CardGameData, DataFile, VaccineGameData } from "@/types/data";

let stored: Partial<Record<DataFile, unknown>> = {};
let isReadFailing = false;
let readCount = 0;

async function getStoredData(file: DataFile): Promise<unknown> {
	readCount += 1;
	if (isReadFailing) throw new Error("읽기 실패");
	return stored[file];
}

mock.module("@/data/storage", () => ({
	getData: getStoredData,
	getImageUrl: (path: string) => `file://${path}`,
}));

const { useCanStart } = await import("@/pages/home/useCanStart");

function StartProbe({ file }: { file: "card-game" | "vaccine-game" }) {
	const canStart = useCanStart(file);
	return <output data-testid="probe">{canStart ? "start" : "blocked"}</output>;
}

const IMAGE = { ko: "images/product/ko.png", en: "images/product/en.png" };

function cardGameWithEnabled(enabledCount: number): CardGameData {
	const data = createDefaultData("card-game");
	return {
		settings: { ...data.settings, pairCount: 4 },
		products: data.products.map((product, index) => ({
			...product,
			image: IMAGE,
			isEnabled: index < enabledCount,
		})),
	};
}

function vaccineGameWithEnabled(enabledCount: number): VaccineGameData {
	return {
		...createDefaultData("vaccine-game"),
		vaccines: Array.from({ length: 6 }, (_, index) => ({
			id: `v${index}`,
			brandName: { ko: "브랜드", en: "Brand" },
			productName: { ko: `제품${index}`, en: `Product${index}` },
			bottleImage: IMAGE,
			logoImage: IMAGE,
			isEnabled: index < enabledCount,
			antigens: [
				{ id: `a${index}`, abbr: "ND", subtype: null, pathogenType: "virus", isPinned: false },
			],
		})),
	};
}

// 처음 값도 blocked 이므로, 읽기가 끝나고 상태가 반영된 뒤에 확인합니다
async function expectProbe(text: "start" | "blocked") {
	await waitFor(() => expect(readCount).toBe(1));
	await act(() => Promise.resolve());
	expect(screen.getByTestId("probe").textContent).toBe(text);
}

beforeEach(() => {
	stored = {};
	isReadFailing = false;
	readCount = 0;
});

afterEach(cleanup);

describe("useCanStart", () => {
	test("확인하기 전에는 시작할 수 없다", () => {
		stored["card-game"] = cardGameWithEnabled(4);
		render(<StartProbe file="card-game" />);

		expect(screen.getByTestId("probe").textContent).toBe("blocked");
	});

	test("카드 쌍 수와 켜진 제품 수가 같으면 시작할 수 있다", async () => {
		stored["card-game"] = cardGameWithEnabled(4);
		render(<StartProbe file="card-game" />);

		await expectProbe("start");
	});

	test.each([3, 5])("카드 4쌍인데 제품이 %i개 켜져 있으면 시작할 수 없다", async (count) => {
		stored["card-game"] = cardGameWithEnabled(count);
		render(<StartProbe file="card-game" />);

		await expectProbe("blocked");
	});

	test("켜진 백신이 범위 안이면 시작할 수 있다", async () => {
		stored["vaccine-game"] = vaccineGameWithEnabled(5);
		render(<StartProbe file="vaccine-game" />);

		await expectProbe("start");
	});

	test.each([0, 6])("켜진 백신이 %i개면 시작할 수 없다", async (count) => {
		stored["vaccine-game"] = vaccineGameWithEnabled(count);
		render(<StartProbe file="vaccine-game" />);

		await expectProbe("blocked");
	});

	test("데이터를 읽지 못하면 시작할 수 없다", async () => {
		isReadFailing = true;
		render(<StartProbe file="card-game" />);

		await expectProbe("blocked");
	});
});
