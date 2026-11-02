import type { CardGameData, ImagePath, Localized, PairCount, ProductSlot } from "@/types/data";

export type EnableProductResult =
	| { isSuccess: true; data: CardGameData }
	| { isSuccess: false; reason: "empty" | "limit" };

/** 등록·수정 모달에서 고르는 중인 사진. 한쪽 언어만 골랐을 수 있습니다 */
export type ProductImageDraft = Partial<Localized<ImagePath>>;

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

/** 다음에 등록할 칸 번호입니다. 칸 번호가 가장 작은 빈 칸이고, 빈 칸이 없으면 undefined */
export function findRegisterSlot(products: ProductSlot[]): number | undefined {
	return products
		.filter((product) => product.image === null)
		.map((product) => product.slot)
		.sort((a, b) => a - b)[0];
}

/**
 * findRegisterSlot 의 칸에 등록해 빈 칸이 늘 목록 아래에 모이게 합니다.
 * 사용 제품이 모자랄 때만 켜고, 결과 화면 표시는 기본값(켬)으로 둡니다
 */
export function registerProduct(data: CardGameData, image: Localized<ImagePath>): CardGameData {
	const slot = findRegisterSlot(data.products);
	if (slot === undefined) return data;

	const others = data.products.filter((product) => product.slot !== slot);
	const hasRoom = countEnabledProducts(others) < data.settings.pairCount;
	return updateProduct(data, slot, () => ({
		...emptySlot(slot),
		image,
		isEnabled: hasRoom,
	}));
}

/** 등록된 제품의 사진만 바꿉니다. 사용과 결과 화면 표시는 그대로 둡니다 */
export function replaceProductImage(
	data: CardGameData,
	slot: number,
	image: Localized<ImagePath>,
): CardGameData {
	return updateProduct(data, slot, (product) =>
		product.image === null ? product : { ...product, image },
	);
}

/** 지운 칸 아래 제품을 한 칸씩 당겨 올려, 빈 칸이 늘 목록 아래에 모이게 합니다 */
export function deleteProduct(data: CardGameData, slot: number): CardGameData {
	return compactProducts(updateProduct(data, slot, (product) => ({ ...product, image: null })));
}

/**
 * 등록된 제품을 칸 번호 순서대로 위로 모으고, 아래는 첫 실행의 빈 칸으로 채웁니다.
 * 사진 없이 켜진 칸도 이때 정리됩니다. 설정을 불러올 때 한 번 거칩니다
 */
export function compactProducts(data: CardGameData): CardGameData {
	const filled = data.products
		.filter((product) => product.image !== null)
		.sort((a, b) => a.slot - b.slot)
		.map((product, index) => ({ ...product, slot: index + 1 }));
	const empty = Array.from({ length: data.products.length - filled.length }, (_, index) =>
		emptySlot(filled.length + index + 1),
	);
	return { ...data, products: [...filled, ...empty] };
}

/** 첫 실행의 빈 칸(defaults.ts)과 같은 상태 */
function emptySlot(slot: number): ProductSlot {
	return { slot, image: null, isEnabled: false, isShownInResult: true };
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
