import type { Orientation } from "@/layout/stage";

export const ORIENTATION_LABEL = {
	landscape: "가로",
	portrait: "세로",
} as const satisfies Record<Orientation, string>;

/** 미리보기 캡션 끝에 붙여 어느 화면 방향의 모습인지 알립니다 */
export function formatOrientationBasis(orientation: Orientation) {
	return `${ORIENTATION_LABEL[orientation]} 화면 기준`;
}
