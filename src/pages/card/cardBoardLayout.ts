import type { Orientation } from "@/layout/stage";
import type { PairCount } from "@/types/data";

type BoardLayout = {
	columns: string;
	rows: string;
};

// Figma "Review · 카드 6·8·10쌍 · C안 · 비율 자유 · 간격 그대로 양옆·위아래 꽉" 기준입니다.
// 카드는 비율을 고정하지 않고 카드판 영역을 가로세로로 꽉 채우며, 간격만 고정합니다
// 카드판 영역. 가로는 x 532~1872, 아래 32 를 띄운 1340x1016 에서 위 여백 pt80 을 뺀 1340x936,
// 세로는 left32 top580 1016x1324
export const CARD_BOARD_AREA = {
	landscape: "absolute right-12 bottom-8 h-254 w-335 pt-20",
	portrait: "absolute top-145 left-8 h-331 w-254",
} as const satisfies Record<Orientation, string>;

export const CARD_BOARD_GAP = {
	landscape: "gap-x-7 gap-y-3",
	portrait: "gap-x-5 gap-y-3.75",
} as const satisfies Record<Orientation, string>;

export const CARD_BOARD_LAYOUT = {
	landscape: {
		6: { columns: "grid-cols-3", rows: "grid-rows-4" },
		8: { columns: "grid-cols-4", rows: "grid-rows-4" },
		10: { columns: "grid-cols-4", rows: "grid-rows-5" },
	},
	portrait: {
		6: { columns: "grid-cols-4", rows: "grid-rows-3" },
		8: { columns: "grid-cols-4", rows: "grid-rows-4" },
		10: { columns: "grid-cols-5", rows: "grid-rows-4" },
	},
} as const satisfies Record<Orientation, Record<PairCount, BoardLayout>>;
