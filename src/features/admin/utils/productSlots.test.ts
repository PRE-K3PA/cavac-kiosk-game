import { describe, expect, test } from "bun:test";
import { createDefaultData } from "@/data/defaults";
import { createMockData } from "@/data/mock/mock-platform";
import { validateForSave } from "@/data/rules";
import {
	changePairCount,
	countEnabledProducts,
	deleteProduct,
	disableEmptyProducts,
	disableProduct,
	enableProduct,
	setProductImage,
	setShownInResult,
} from "@/features/admin/utils/productSlots";
import type { CardGameData, ImagePath, Localized, PairCount } from "@/types/data";

/** 모양 검사(imagePathSchema)의 경로 형식 images/product/<uuid>.png 를 지키는 테스트용 사진 */
function productImage(id: number): Localized<ImagePath> {
	const suffix = String(id).padStart(12, "0");
	return {
		ko: `images/product/00000000-0000-4000-8000-${suffix}.png`,
		en: `images/product/00000000-0000-4000-9000-${suffix}.png`,
	};
}

const NEW_IMAGE = productImage(100);

function filledCardGame(): CardGameData {
	return createMockData("filled")["card-game"];
}

function emptyCardGame(): CardGameData {
	return createMockData("empty")["card-game"];
}

function deepFreeze<T>(value: T): T {
	if (typeof value === "object" && value !== null) {
		for (const child of Object.values(value)) deepFreeze(child);
		Object.freeze(value);
	}
	return value;
}

/** 사용 제품의 칸 번호를 작은 번호부터 */
function selectedSlots(data: CardGameData): number[] {
	return data.products
		.filter((product) => product.isEnabled)
		.map((product) => product.slot)
		.sort((a, b) => a - b);
}

function hiddenFromResultSlots(data: CardGameData): number[] {
	return data.products.filter((product) => !product.isShownInResult).map((product) => product.slot);
}

describe("쌍 수 변경", () => {
	test("8쌍에서 4쌍으로 바꾸면 1~4번 제품만 사용 제품이 된다", () => {
		const changed = changePairCount(filledCardGame(), 4);

		expect(changed.settings.pairCount).toBe(4);
		expect(selectedSlots(changed)).toEqual([1, 2, 3, 4]);
	});

	test("사진이 없는 등록 칸은 건너뛰고 다음 칸을 켠다", () => {
		const data = filledCardGame();
		data.products[1].image = null;

		expect(selectedSlots(changePairCount(data, 4))).toEqual([1, 3, 4, 5]);
	});

	test("직접 고른 사용 제품이 있어도 모두 끄고 1번부터 다시 켠다", () => {
		const data = filledCardGame();
		data.products[0].isEnabled = false;
		data.products[8].isEnabled = true;

		expect(selectedSlots(changePairCount(data, 4))).toEqual([1, 2, 3, 4]);
	});

	test("제품 목록이 칸 번호 순서가 아니어도 1번 칸부터 켠다", () => {
		const data = filledCardGame();
		data.products.reverse();

		expect(selectedSlots(changePairCount(data, 4))).toEqual([1, 2, 3, 4]);
	});

	test("사진이 있는 칸이 쌍 수보다 적으면 있는 만큼만 켠다", () => {
		expect(selectedSlots(changePairCount(filledCardGame(), 12))).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
		]);
	});

	test("지금과 같은 쌍 수를 고르면 직접 고른 사용 제품이 그대로다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;
		data.products[8].isEnabled = true;

		expect(selectedSlots(changePairCount(data, 8))).toEqual([1, 2, 3, 4, 5, 6, 7, 9]);
	});

	test("결과 화면 표시 값은 바꾸지 않는다", () => {
		const changed = changePairCount(filledCardGame(), 4);

		expect(hiddenFromResultSlots(changed)).toEqual([6, 7]);
	});
});

describe("사용 켜기", () => {
	test("사용 제품이 쌍 수보다 적으면 켠다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;

		const result = enableProduct(data, 9);

		expect(result.isSuccess).toBe(true);
		if (result.isSuccess) {
			expect(selectedSlots(result.data)).toEqual([1, 2, 3, 4, 5, 6, 7, 9]);
		}
	});

	test("이미 쌍 수만큼 켜져 있으면 켜지 않고 limit 을 돌려준다", () => {
		expect(enableProduct(filledCardGame(), 9)).toEqual({ isSuccess: false, reason: "limit" });
	});

	test("사진이 없는 등록 칸은 켜지 않고 empty 를 돌려준다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;

		expect(enableProduct(data, 11)).toEqual({ isSuccess: false, reason: "empty" });
	});

	test("빈 칸이면서 쌍 수만큼 켜져 있으면 empty 를 먼저 알린다", () => {
		expect(enableProduct(filledCardGame(), 11)).toEqual({ isSuccess: false, reason: "empty" });
	});

	test("없는 칸 번호는 empty 를 돌려준다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;

		expect(enableProduct(data, 13)).toEqual({ isSuccess: false, reason: "empty" });
	});

	test("이미 켜진 제품을 다시 켜면 쌍 수가 차 있어도 그대로 성공한다", () => {
		const result = enableProduct(filledCardGame(), 1);

		expect(result.isSuccess).toBe(true);
		if (result.isSuccess) {
			expect(selectedSlots(result.data)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
		}
	});
});

describe("제품 등록·수정", () => {
	test("빈 칸에 등록할 때 사용 제품이 쌍 수보다 적으면 켠다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;

		const registered = setProductImage(data, 11, NEW_IMAGE);

		expect(registered.products[10].image).toEqual(NEW_IMAGE);
		expect(selectedSlots(registered)).toEqual([1, 2, 3, 4, 5, 6, 7, 11]);
	});

	test("빈 칸에 등록할 때 사용 제품이 이미 쌍 수만큼이면 꺼진 채로 둔다", () => {
		const registered = setProductImage(filledCardGame(), 11, NEW_IMAGE);

		expect(registered.products[10].image).toEqual(NEW_IMAGE);
		expect(selectedSlots(registered)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	test("켜진 제품의 사진을 바꿔도 켜진 채로 둔다", () => {
		const edited = setProductImage(filledCardGame(), 1, NEW_IMAGE);

		expect(edited.products[0].image).toEqual(NEW_IMAGE);
		expect(selectedSlots(edited)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	test("꺼진 제품의 사진을 바꿔도 꺼진 채로 둔다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;

		const edited = setProductImage(data, 9, NEW_IMAGE);

		expect(edited.products[8].image).toEqual(NEW_IMAGE);
		expect(selectedSlots(edited)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	test("사진 없이 켜져 있던 칸에 등록하면 그 칸은 켜진 채로 둔다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;
		data.products[10].isEnabled = true;

		expect(selectedSlots(setProductImage(data, 11, NEW_IMAGE))).toEqual([1, 2, 3, 4, 5, 6, 7, 11]);
	});

	test("빈 칸에 새로 등록하면 결과 화면 표시는 기본값(켬)이다", () => {
		const data = emptyCardGame();
		data.products[0].isShownInResult = false;

		expect(setProductImage(data, 1, NEW_IMAGE).products[0].isShownInResult).toBe(true);
	});
});

describe("제품 삭제", () => {
	test("사진을 지우고 끄며, 결과 화면 표시는 켬으로 되돌린다", () => {
		const deleted = deleteProduct(filledCardGame(), 6);

		expect(deleted.products[5]).toEqual(createDefaultData("card-game").products[5]);
	});
});

describe("불러오기 보정", () => {
	test("사진이 없는데 켜진 칸만 끄고 나머지는 그대로 둔다", () => {
		const data = filledCardGame();
		data.products[10].isEnabled = true;

		expect(selectedSlots(disableEmptyProducts(data))).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});
});

describe("사용 끄기, 결과 화면 표시, 사용 제품 수", () => {
	test("사용을 끄면 그 제품만 꺼진다", () => {
		expect(selectedSlots(disableProduct(filledCardGame(), 3))).toEqual([1, 2, 4, 5, 6, 7, 8]);
	});

	test("결과 화면 표시를 켜고 끌 수 있다", () => {
		const shown = setShownInResult(filledCardGame(), 6, true);
		const hidden = setShownInResult(shown, 1, false);

		expect(hiddenFromResultSlots(hidden)).toEqual([1, 7]);
	});

	test("사용 제품 수는 켜진 제품만 센다", () => {
		expect(countEnabledProducts(filledCardGame().products)).toBe(8);
	});
});

describe("받은 값", () => {
	test("받은 값을 바꾸지 않고 새 값을 돌려준다", () => {
		const data = deepFreeze(filledCardGame());

		expect(() => {
			changePairCount(data, 4);
			enableProduct(disableProduct(data, 8), 9);
			setProductImage(data, 11, NEW_IMAGE);
			setShownInResult(data, 6, true);
			deleteProduct(data, 1);
			disableEmptyProducts(data);
		}).not.toThrow();
		expect(data).toEqual(filledCardGame());
	});
});

describe("저장 규칙과 함께", () => {
	test.each([4, 8, 12] as const)(
		"첫 실행에서 %i쌍으로 고르고 그만큼 등록하면 저장할 수 있다",
		(pairCount: PairCount) => {
			let data = changePairCount(emptyCardGame(), pairCount);
			for (let slot = 1; slot <= pairCount; slot += 1) {
				data = setProductImage(data, slot, productImage(slot));
			}

			expect(validateForSave("card-game", data)).toMatchObject({ isValid: true });
		},
	);

	test("목데이터를 4쌍으로 줄였다가 8쌍으로 되돌려도 저장할 수 있다", () => {
		const reduced = changePairCount(filledCardGame(), 4);
		const restored = changePairCount(reduced, 8);

		expect(validateForSave("card-game", reduced)).toMatchObject({ isValid: true });
		expect(validateForSave("card-game", restored)).toMatchObject({ isValid: true });
	});

	test("사진이 10장뿐인 목데이터를 12쌍으로 바꾸면 사용 제품 수가 모자라 저장할 수 없다", () => {
		const changed = changePairCount(filledCardGame(), 12);

		expect(validateForSave("card-game", changed)).toEqual({
			isValid: false,
			issues: [expect.stringContaining("현재 10개")],
		});
	});
});
