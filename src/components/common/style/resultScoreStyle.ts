import { cn } from "@/utils/cn";

// 결과 화면(VaccineResult, CardResult) 점수 모양이 같아야 해서 한 곳에 둡니다.
// bg-clip-text 글자에는 text-stroke 가 안쪽으로 걸쳐 그라데이션을 가리므로,
// 외곽선과 그림자는 같은 글자를 뒤에 한 겹 더 깔아서 그립니다. Figma 외곽선은 약 10px 입니다
export const RESULT_SCORE_GRADIENT =
	"bg-linear-to-b from-accent-yellow to-accent-amber bg-clip-text text-transparent";

export const RESULT_SCORE_BACKDROP = cn(
	"absolute inset-0 whitespace-nowrap",
	"text-text-primary text-shadow-hard-lg outlined-text [--text-outline-width:20px]",
);
