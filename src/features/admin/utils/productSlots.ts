import type { CardGameData, ImagePath, Localized, PairCount, ProductSlot } from "@/types/data";

export type EnableProductResult =
	| { isSuccess: true; data: CardGameData }
	| { isSuccess: false; reason: "empty" | "limit" };

export function countEnabledProducts(products: ProductSlot[]): number {
	return products.filter((product) => product.isEnabled).length;
}

/** 쌍 수를 바꾸면 1번부터 사진이 있는 칸을 쌍 수만큼 켭니다 (Figma Q23) */
export function changePairCount(data: CardGameData, pairCount: PairCount): CardGameData {
	if (pairCount === data.settings.pairCount) return data;

	const slotsToEnable = new Set(
		data.products
			.filter((product) => product.image !== null)
			.map((product) => product.slot)
			.sort((a, b) => a - b)
			.slice(0, pairCount),
	);
	const products = data.products.map((product) => ({
		...product,
		isEnabled: slotsToEnable.has(product.slot),
	}));
	return { ...data, settings: { ...data.settings, pairCount }, products };
}

export function enableProduct(data: CardGameData, slot: number): EnableProductResult {
	const target = data.products.find((product) => product.slot === slot);
	if (target === undefined || target.image === null) {
		return { isSuccess: false, reason: "empty" };
	}
	if (target.isEnabled) return { isSuccess: true, data };
	if (countEnabledProducts(data.products) >= data.settings.pairCount) {
		return { isSuccess: false, reason: "limit" };
	}

	return {
		isSuccess: true,
		data: updateProduct(data, slot, (product) => ({ ...product, isEnabled: true })),
	};
}

export function disableProduct(data: CardGameData, slot: number): CardGameData {
	return updateProduct(data, slot, (product) => ({ ...product, isEnabled: false }));
}

export function setShownInResult(
	data: CardGameData,
	slot: number,
	isShownInResult: boolean,
): CardGameData {
	return updateProduct(data, slot, (product) => ({ ...product, isShownInResult }));
}

/**
 * 빈 칸에 등록하면 사용 제품이 모자랄 때만 켜고, 결과 화면 표시는 기본값(켬)으로 둡니다.
 * 수정은 사진만 바꿉니다
 */
export function setProductImage(
	data: CardGameData,
	slot: number,
	image: Localized<ImagePath>,
): CardGameData {
	const others = data.products.filter((product) => product.slot !== slot);
	const hasRoom = countEnabledProducts(others) < data.settings.pairCount;
	return updateProduct(data, slot, (product) =>
		product.image === null
			? { ...product, image, isEnabled: hasRoom, isShownInResult: true }
			: { ...product, image },
	);
}

/** 지운 칸은 첫 실행의 빈 칸(defaults.ts)과 같은 상태로 되돌립니다 */
export function deleteProduct(data: CardGameData, slot: number): CardGameData {
	return updateProduct(data, slot, (product) => ({
		...product,
		image: null,
		isEnabled: false,
		isShownInResult: true,
	}));
}

/**
 * 사진 없이 켜진 칸을 끕니다. 모양 검사는 통과하지만 행에서는 빈 칸으로 보여 끌 방법이 없습니다.
 * 설정을 불러올 때 한 번 거칩니다
 */
export function disableEmptyProducts(data: CardGameData): CardGameData {
	const products = data.products.map((product) =>
		product.image === null && product.isEnabled ? { ...product, isEnabled: false } : product,
	);
	return { ...data, products };
}

function updateProduct(
	data: CardGameData,
	slot: number,
	update: (product: ProductSlot) => ProductSlot,
): CardGameData {
	const products = data.products.map((product) =>
		product.slot === slot ? update(product) : product,
	);
	return { ...data, products };
}
