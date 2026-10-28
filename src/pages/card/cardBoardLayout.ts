import type { Orientation } from "@/layout/stage";
import type { PairCount } from "@/types/data";

type BoardLayout = {
	columns: string;
	card: string;
	gap: string;
	hasCenterLogo: boolean;
};

// 카드 크기와 간격은 Figma "Review · 카드 4·8·12쌍 · 화면 방향마다 카드 모양 하나" 개선안의 07 화면
// 값 그대로입니다. 가로는 가로형 카드(4쌍 424x304, 8쌍 314x225, 12쌍 246x176),
// 세로는 세로형 카드(4쌍 325x431, 8쌍 239x317, 12쌍 187x248)
// 4쌍(3x3)과 12쌍(5x5)은 카드 수가 짝수라 남는 가운데 칸에 로고를 둡니다
// 카드판 영역. 가로는 왼쪽 패널(x 50~470)과 32 띄우고 오른쪽 48, 아래 32 를 띄운 1370x1016 에서
// 위 여백 pt80 을 뺀 936 이 카드가 쓸 높이, 세로는 left32 top580 1016x1324
export const CARD_BOARD_AREA = {
	landscape: "absolute right-12 bottom-8 h-254 w-342.5 pt-20",
	portrait: "absolute top-145 left-8 h-331 w-254",
} as const satisfies Record<Orientation, string>;

export const CARD_BOARD_LAYOUT = {
	landscape: {
		4: { columns: "grid-cols-3", card: "h-76 w-106", gap: "gap-x-7 gap-y-3", hasCenterLogo: true },
		8: {
			columns: "grid-cols-4",
			card: "h-56.25 w-78.5",
			gap: "gap-x-7 gap-y-3",
			hasCenterLogo: false,
		},
		12: {
			columns: "grid-cols-5",
			card: "h-44 w-61.5",
			gap: "gap-x-7 gap-y-3",
			hasCenterLogo: true,
		},
	},
	portrait: {
		4: {
			columns: "grid-cols-3",
			card: "h-107.75 w-81.25",
			gap: "gap-x-5 gap-y-3.75",
			hasCenterLogo: true,
		},
		8: {
			columns: "grid-cols-4",
			card: "h-79.25 w-59.75",
			gap: "gap-x-5 gap-y-3.75",
			hasCenterLogo: false,
		},
		12: {
			columns: "grid-cols-5",
			card: "h-62 w-46.75",
			gap: "gap-x-5 gap-y-3.75",
			hasCenterLogo: true,
		},
	},
} as const satisfies Record<Orientation, Record<PairCount, BoardLayout>>;
