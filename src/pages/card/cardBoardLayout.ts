import type { Orientation } from "@/layout/stage";
import type { PairCount } from "@/types/data";

type BoardLayout = {
	columns: string;
	card: string;
	gap: string;
};

// 카드 크기와 간격은 Figma "Review · 카드 4·8·12쌍" 개선안의 07 화면 값 그대로입니다
// 가로: 4쌍 314x456(세로형), 8쌍 296x212, 12쌍 200x212. 세로: 4쌍 490x313(가로형), 8쌍 236x313,
// 12쌍 236x204
// 카드판 영역. 가로는 왼쪽 패널(x 50~470)과 32 띄우고 오른쪽 48, 아래 32 를 띄운 1370x1016 에서
// 위 여백 pt80 을 뺀 936 이 카드가 쓸 높이(가로 4쌍 두 줄이 꼭 맞음), 세로는 left32 top580 1016x1324
export const CARD_BOARD_AREA = {
	landscape: "absolute right-12 bottom-8 h-254 w-342.5 pt-20",
	portrait: "absolute top-145 left-8 h-331 w-254",
} as const satisfies Record<Orientation, string>;

export const CARD_BOARD_LAYOUT = {
	landscape: {
		4: { columns: "grid-cols-4", card: "h-114 w-78.5", gap: "gap-x-7 gap-y-6" },
		8: { columns: "grid-cols-4", card: "h-53 w-74", gap: "gap-x-7 gap-y-3" },
		12: { columns: "grid-cols-6", card: "h-53 w-50", gap: "gap-x-7 gap-y-3" },
	},
	portrait: {
		4: { columns: "grid-cols-2", card: "h-78.25 w-122.5", gap: "gap-x-6 gap-y-3.75" },
		8: { columns: "grid-cols-4", card: "h-78.25 w-59", gap: "gap-x-5 gap-y-3.75" },
		12: { columns: "grid-cols-4", card: "h-51 w-59", gap: "gap-x-5 gap-y-3.75" },
	},
} as const satisfies Record<Orientation, Record<PairCount, BoardLayout>>;
