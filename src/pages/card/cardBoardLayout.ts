import type { Orientation } from "@/layout/stage";
import type { PairCount } from "@/types/data";

type BoardLayout = {
	columns: string;
	card: string;
	gap: string;
};

// 세로 크기는 Figma 최종 07 세로 화면 기준이고, 세로 영역 1016x1324 에 안 들어가는 조합만 비율을 유지해
// 내림으로 줄였습니다(원래 -> 줄인 값): 4쌍 250x331 -> 236x313
// 세로 12쌍은 높이가 한도라 너무 작아서, 세로 간격을 16 으로 줄이고 4:5 비율로 키웠습니다: 165x206
// 가로 화면 카드는 가로형입니다. MemoryCard 기본 크기(296x212)의 비율로 가로 영역 1370x888 에 가장 크게
// 들어가는 값입니다: 4쌍 318x228, 8쌍 285x204
// 12쌍은 너비가 한도라 그 비율로는 너무 작아서, 간격을 16 으로 줄이고 5:4 비율로 키웠습니다: 215x172
// 카드판 영역. 가로는 왼쪽 패널(x 50~470)과 32 띄우고, 오른쪽과 아래는 타이머와 같은 48 을 띄운
// 1370x968 에서 위 여백 pt80 을 뺀 888 이 카드가 쓸 높이, 세로는 left32 top580 1016x1324
export const CARD_BOARD_AREA = {
	landscape: "absolute right-12 bottom-12 h-242 w-342.5 pt-20",
	portrait: "absolute top-145 left-8 h-331 w-254",
} as const satisfies Record<Orientation, string>;

export const CARD_BOARD_LAYOUT = {
	landscape: {
		4: { columns: "grid-cols-4", card: "h-57 w-79.5", gap: "gap-x-8 gap-y-8" },
		8: { columns: "grid-cols-4", card: "h-51 w-71.25", gap: "gap-x-6 gap-y-6" },
		12: { columns: "grid-cols-6", card: "h-43 w-53.75", gap: "gap-x-4 gap-y-4" },
	},
	portrait: {
		4: { columns: "grid-cols-2", card: "h-78.25 w-59", gap: "gap-x-8 gap-y-6" },
		8: { columns: "grid-cols-4", card: "h-78.25 w-59", gap: "gap-x-5 gap-y-3.75" },
		12: { columns: "grid-cols-4", card: "h-51.5 w-41.25", gap: "gap-x-8 gap-y-4" },
	},
} as const satisfies Record<Orientation, Record<PairCount, BoardLayout>>;
