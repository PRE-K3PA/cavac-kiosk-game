import { describe, expect, test } from "bun:test";
import type { Orientation } from "@/layout/stage";
import { CARD_BOARD_LAYOUT } from "@/pages/card/cardBoardLayout";
import { PAIR_COUNTS } from "@/types/data";

function count(className: string, prefix: string): number {
	return Number(className.slice(`${prefix}-`.length));
}

const ORIENTATIONS: Orientation[] = ["landscape", "portrait"];

describe.each(ORIENTATIONS)("%s 카드판", (orientation) => {
	test.each([...PAIR_COUNTS])("%i쌍은 빈칸 없이 카드 수만큼 칸이 있다", (pairCount) => {
		const { columns, rows } = CARD_BOARD_LAYOUT[orientation][pairCount];

		expect(count(columns, "grid-cols") * count(rows, "grid-rows")).toBe(pairCount * 2);
	});
});
