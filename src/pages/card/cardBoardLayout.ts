import type { Orientation } from "@/layout/stage";
import type { PairCount } from "@/types/data";

type BoardLayout = {
	columns: string;
	card: string;
	gap: string;
};

// Figma 크기는 가로 Layout C, 세로 최종 07 세로 화면 기준입니다. 카드판 영역(가로 1462x936, 세로 1016x1324)에
// 안 들어가는 조합만 비율을 유지해 내림으로 줄였습니다(원래 -> 줄인 값):
// 가로 8,12쌍 178x236 -> 163x216, 세로 4쌍 250x331 -> 236x313, 세로 12쌍 165x218 -> 151x200
// 카드판 영역. 가로 1462x1016 에서 위 여백 pt80 을 뺀 936 이 카드가 쓸 높이, 세로는 left32 top580 1016x1324
export const CARD_BOARD_AREA = {
	landscape: "absolute right-0 bottom-0 h-254 w-365.5 pt-20",
	portrait: "absolute top-145 left-8 h-331 w-254",
} as const satisfies Record<Orientation, string>;

export const CARD_BOARD_LAYOUT = {
	landscape: {
		4: { columns: "grid-cols-4", card: "h-98 w-74", gap: "gap-x-8 gap-y-8" },
		8: { columns: "grid-cols-4", card: "h-54 w-40.75", gap: "gap-x-6 gap-y-6" },
		12: { columns: "grid-cols-6", card: "h-54 w-40.75", gap: "gap-x-6 gap-y-6" },
	},
	portrait: {
		4: { columns: "grid-cols-2", card: "h-78.25 w-59", gap: "gap-x-8 gap-y-6" },
		8: { columns: "grid-cols-4", card: "h-78.25 w-59", gap: "gap-x-5 gap-y-3.75" },
		12: { columns: "grid-cols-4", card: "h-50 w-37.75", gap: "gap-x-8 gap-y-6" },
	},
} as const satisfies Record<Orientation, Record<PairCount, BoardLayout>>;
