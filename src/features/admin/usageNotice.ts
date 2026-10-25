/** 목록 머리 "사용 N / N" 근처 안내 줄. 카드 제품 목록과 백신 목록이 함께 씁니다. info 는 앰버, error 는 빨강입니다 */
export type UsageNotice = {
	tone: "info" | "error";
	message: string;
};
