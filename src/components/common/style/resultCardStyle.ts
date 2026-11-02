// 결과 카드(VaccineResultCard, ProductResultCard)와 ResultCarousel 슬롯이 같은 크기여야 해서 한 곳에 둡니다
export const RESULT_CARD_SIZE = {
	default: "h-105 w-150",
	large: "h-147 w-210",
} as const;

export const RESULT_CARD_FRAME = {
	default: `${RESULT_CARD_SIZE.default} rounded-3xl border-4 p-6`,
	large: `${RESULT_CARD_SIZE.large} rounded-[34px] border-6 p-8.5`,
} as const;
