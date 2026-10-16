/// <reference path="../../../electron/preload/api.ts" />
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import type { CommonData } from "@/types/data";

let storedCommon: Partial<CommonData> = {};
let isReadFailing = false;
let isRead = false;

async function getStoredCommon(): Promise<Partial<CommonData>> {
	isRead = true;
	if (isReadFailing) throw new Error("읽기 실패");
	return storedCommon;
}

mock.module("@/data/storage", () => ({
	getData: getStoredCommon,
	getImageUrl: (path: string) => `file://${path}`,
}));

const { useHomeAnimals } = await import("@/pages/home/useHomeAnimals");

function AnimalProbe() {
	const animals = useHomeAnimals();
	return (
		<ul>
			{Object.entries(animals).map(([slot, animal]) => (
				<li key={slot} data-testid={slot}>
					{`${animal.name}|${animal.src}`}
				</li>
			))}
		</ul>
	);
}

const SPECIES = [
	{ id: "s1", name: "닭", character: "images/species/chicken.png" },
	{ id: "s2", name: "돼지", character: "images/species/pig.png" },
];

beforeEach(() => {
	storedCommon = {};
	isReadFailing = false;
	isRead = false;
});

afterEach(cleanup);

describe("useHomeAnimals", () => {
	test("저장된 배치대로 슬롯마다 이름과 이미지 주소가 채워진다", async () => {
		storedCommon = {
			species: SPECIES,
			homeAnimals: [
				{ slot: "left-2", speciesId: "s1" },
				{ slot: "right-1", speciesId: "s2" },
			],
		};
		render(<AnimalProbe />);

		expect((await screen.findByTestId("left-2")).textContent).toBe(
			"닭|file://images/species/chicken.png",
		);
		expect(screen.getByTestId("right-1").textContent).toBe("돼지|file://images/species/pig.png");
		expect(screen.queryByTestId("left-1")).toBeNull();
	});

	test("저장 데이터를 읽지 못해도 예외 없이 빈 상태로 렌더된다", async () => {
		isReadFailing = true;
		render(<AnimalProbe />);

		await waitFor(() => expect(isRead).toBe(true));
		expect(screen.queryAllByRole("listitem")).toHaveLength(0);
	});

	test("축종 목록에 없는 speciesId 는 건너뛰고 나머지는 보여준다", async () => {
		storedCommon = {
			species: SPECIES,
			homeAnimals: [
				{ slot: "left-2", speciesId: "missing" },
				{ slot: "left-1", speciesId: "s2" },
			],
		};
		render(<AnimalProbe />);

		expect((await screen.findByTestId("left-1")).textContent).toContain("돼지");
		expect(screen.queryByTestId("left-2")).toBeNull();
	});
});
