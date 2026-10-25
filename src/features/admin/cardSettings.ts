import type { CardGameData, PairCount } from "@/types/data";

/** 목록 머리 "사용 N / N" 근처 안내 줄. 카드 제품 목록과 백신 목록이 함께 씁니다. info 는 앰버, error 는 빨강입니다 */
export type UsageNotice = {
	tone: "info" | "error";
	message: string;
};

/**
 * 제품 설정이 저장 규칙에 걸릴 때 할 일을 알려 주는 안내입니다.
 * 등록된 제품이 하나도 없는 빈 상태만 앰버, 나머지는 빨강입니다 (Figma _Empty, _ProductsShort)
 */
export function getUsageNotice(data: CardGameData): UsageNotice | null {
	const { pairCount } = data.settings;

	const registeredCount = data.products.filter((product) => product.image !== null).length;
	if (registeredCount < pairCount) {
		return {
			tone: registeredCount === 0 ? "info" : "error",
			message: `제품 ${pairCount - registeredCount}개를 더 등록해 주세요`,
		};
	}

	const enabled = data.products.filter((product) => product.isEnabled);
	const missing = pairCount - enabled.length;
	if (missing > 0) {
		return {
			tone: "error",
			message: `켜진 제품이 ${missing}개 모자랍니다. ${missing}개를 더 켜 주세요.`,
		};
	}

	if (enabled.length > 0 && !enabled.some((product) => product.isShownInResult)) {
		return { tone: "error", message: "결과 화면에 보여 줄 제품을 1개 이상 골라 주세요." };
	}
	return null;
}

/** 쌍 수만큼 켠 상태에서 더 켜려 할 때 잠깐 보여 주는 안내입니다 (Q21·22) */
export function getLimitNotice(pairCount: PairCount): UsageNotice {
	return {
		tone: "info",
		message: `이미 ${pairCount}개를 모두 켰습니다. 다른 제품을 끈 뒤 켜 주세요.`,
	};
}
