import { describe, expect, test } from "bun:test";
import type { Orientation } from "@/layout/stage";
import { CARD_BOARD_AREA, CARD_BOARD_LAYOUT } from "@/pages/card/cardBoardLayout";
import type { PairCount } from "@/types/data";

// 클래스의 숫자는 4px 단위입니다
const UNIT = 4;

function px(className: string, prefix: string): number {
	const token = className.split(" ").find((name) => name.startsWith(`${prefix}-`));
	return Number(token?.slice(prefix.length + 1)) * UNIT;
}

const ORIENTATIONS: Orientation[] = ["landscape", "portrait"];
const PAIR_COUNTS: PairCount[] = [4, 8, 12];

describe.each(ORIENTATIONS)("%s 카드판", (orientation) => {
	test.each(PAIR_COUNTS)("%i쌍은 카드판 영역 안에 들어간다", (pairCount) => {
		const { columns, card, gap } = CARD_BOARD_LAYOUT[orientation][pairCount];
		const columnCount = Number(columns.slice("grid-cols-".length));
		const rowCount = (pairCount * 2) / columnCount;
		const width = columnCount * px(card, "w") + (columnCount - 1) * px(gap, "gap-x");
		const height = rowCount * px(card, "h") + (rowCount - 1) * px(gap, "gap-y");

		const area = CARD_BOARD_AREA[orientation];
		expect(width).toBeLessThanOrEqual(px(area, "w"));
		expect(height).toBeLessThanOrEqual(px(area, "h") - (px(area, "pt") || 0));
	});
});
