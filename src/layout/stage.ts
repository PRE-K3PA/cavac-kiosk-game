export type Orientation = "landscape" | "portrait";

export type StageSize = { width: number; height: number };

export const STAGE_SIZE = {
	landscape: { width: 1920, height: 1080 },
	portrait: { width: 1080, height: 1920 },
} as const satisfies Record<Orientation, StageSize>;

export type StageFit = {
	orientation: Orientation;
	scale: number;
};

// 창이 아직 크기를 못 받은 순간(0, NaN)에도 화면이 사라지지 않게 원본 크기로 둔다
const FALLBACK_FIT: StageFit = { orientation: "landscape", scale: 1 };

export function fitStage(viewport: StageSize): StageFit {
	const { width, height } = viewport;
	if (!(width > 0 && height > 0)) return FALLBACK_FIT;

	const orientation = width >= height ? "landscape" : "portrait";
	const stage = STAGE_SIZE[orientation];
	return { orientation, scale: Math.min(width / stage.width, height / stage.height) };
}
