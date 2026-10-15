import { describe, expect, test } from "bun:test";
import { createDefaultData } from "@/data/defaults";
import { createMockData } from "@/data/mock/mock-platform";
import { validateForSave } from "@/data/rules";
import {
	changePairCount,
	compactProducts,
	countEnabledProducts,
	deleteProduct,
	disableProduct,
	enableProduct,
	registerProduct,
	replaceProductImage,
	setShownInResult,
} from "@/features/admin/productSlots";
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

function filledSlots(data: CardGameData): number[] {
	return data.products.filter((product) => product.image !== null).map((product) => product.slot);
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

describe("제품 등록", () => {
	test("첫 빈 칸에 등록하고, 사용 제품이 쌍 수보다 적으면 켠다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;

		const registered = registerProduct(data, NEW_IMAGE);

		expect(registered.products[10].image).toEqual(NEW_IMAGE);
		expect(selectedSlots(registered)).toEqual([1, 2, 3, 4, 5, 6, 7, 11]);
	});

	test("사용 제품이 이미 쌍 수만큼이면 꺼진 채로 등록한다", () => {
		const registered = registerProduct(filledCardGame(), NEW_IMAGE);

		expect(registered.products[10].image).toEqual(NEW_IMAGE);
		expect(selectedSlots(registered)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	test("중간에 빈 칸이 있으면 그 칸에 등록한다", () => {
		const data = filledCardGame();
		data.products[1].image = null;

		expect(registerProduct(data, NEW_IMAGE).products[1].image).toEqual(NEW_IMAGE);
	});

	test("빈 칸이 없으면 그대로 둔다", () => {
		const data = filledCardGame();
		data.products[10].image = productImage(11);
		data.products[11].image = productImage(12);

		expect(registerProduct(data, NEW_IMAGE)).toEqual(data);
	});

	test("사진 없이 켜져 있던 칸에 등록하면 그 칸은 켜진 채로 둔다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;
		data.products[10].isEnabled = true;

		expect(selectedSlots(registerProduct(data, NEW_IMAGE))).toEqual([1, 2, 3, 4, 5, 6, 7, 11]);
	});

	test("새로 등록하면 결과 화면 표시는 기본값(켬)이다", () => {
		const data = emptyCardGame();
		data.products[0].isShownInResult = false;

		expect(registerProduct(data, NEW_IMAGE).products[0].isShownInResult).toBe(
			createDefaultData("card-game").products[0].isShownInResult,
		);
	});
});

describe("사진 수정", () => {
	test("켜진 제품의 사진을 바꿔도 켜진 채로 둔다", () => {
		const edited = replaceProductImage(filledCardGame(), 1, NEW_IMAGE);

		expect(edited.products[0].image).toEqual(NEW_IMAGE);
		expect(selectedSlots(edited)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	test("꺼진 제품의 사진을 바꿔도 꺼진 채로 둔다", () => {
		const data = filledCardGame();
		data.products[7].isEnabled = false;

		const edited = replaceProductImage(data, 9, NEW_IMAGE);

		expect(edited.products[8].image).toEqual(NEW_IMAGE);
		expect(selectedSlots(edited)).toEqual([1, 2, 3, 4, 5, 6, 7]);
	});

	test("빈 칸에는 사진을 넣지 않는다 (등록은 registerProduct)", () => {
		const data = filledCardGame();

		expect(replaceProductImage(data, 11, NEW_IMAGE)).toEqual(data);
	});
});

describe("제품 삭제", () => {
	test("지운 칸 아래 제품이 한 칸씩 올라오고, 맨 아래에 첫 실행의 빈 칸이 생긴다", () => {
		// 6번은 켜져 있고 결과 화면 표시가 꺼져 있어, 지운 제품의 값이 남으면 빈 칸 비교에서 드러납니다
		const deleted = deleteProduct(filledCardGame(), 6);

		expect(filledSlots(deleted)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
		expect(deleted.products[5].image).toEqual(filledCardGame().products[6].image);
		expect(selectedSlots(deleted)).toEqual([1, 2, 3, 4, 5, 6, 7]);
		expect(hiddenFromResultSlots(deleted)).toEqual([6]);
		expect(deleted.products.slice(9)).toEqual(createDefaultData("card-game").products.slice(9));
	});
});

describe("빈 칸 정리 (불러올 때)", () => {
	test("중간의 빈 칸을 없애고 아래 제품을 당겨 올린다", () => {
		const data = filledCardGame();
		data.products[1].image = null;
		data.products[4].image = null;

		const compacted = compactProducts(data);

		expect(filledSlots(compacted)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
		expect(compacted.products[2].image).toEqual(data.products[3].image);
		expect(selectedSlots(compacted)).toEqual([1, 2, 3, 4, 5, 6]);
		expect(hiddenFromResultSlots(compacted)).toEqual([4, 5]);
	});

	test("사진 없이 켜진 칸은 첫 실행의 빈 칸으로 되돌린다", () => {
		const data = filledCardGame();
		data.products[10].isEnabled = true;
		data.products[10].isShownInResult = false;

		const compacted = compactProducts(data);

		expect(compacted.products[10]).toEqual(createDefaultData("card-game").products[10]);
		expect(selectedSlots(compacted)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
	});

	test("칸 번호 순서가 아닌 목록도 1번 칸부터 순서대로 정리한다", () => {
		const data = filledCardGame();
		data.products.reverse();

		const compacted = compactProducts(data);

		expect(compacted.products.map((product) => product.slot)).toEqual([
			1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
		]);
		expect(compacted.products[0].image).toEqual(filledCardGame().products[0].image);
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
			registerProduct(data, NEW_IMAGE);
			replaceProductImage(data, 1, NEW_IMAGE);
			setShownInResult(data, 6, true);
			deleteProduct(data, 1);
			compactProducts(data);
		}).not.toThrow();
		expect(data).toEqual(filledCardGame());
	});
});

describe("저장 규칙과 함께", () => {
	test.each([4, 8, 12] as const)(
		"첫 실행에서 %i쌍으로 고르고 그만큼 등록하면 저장할 수 있다",
		(pairCount: PairCount) => {
			let data = changePairCount(emptyCardGame(), pairCount);
			for (let id = 1; id <= pairCount; id += 1) {
				data = registerProduct(data, productImage(id));
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

	test("켜진 제품을 지우면 칸 1~12 는 그대로이고 사용 제품 수만 모자라 저장할 수 없다", () => {
		const deleted = deleteProduct(filledCardGame(), 3);

		expect(validateForSave("card-game", deleted)).toEqual({
			isValid: false,
			issues: [expect.stringContaining("현재 7개")],
		});
	});

	test("사진이 10장뿐인 목데이터를 12쌍으로 바꾸면 사용 제품 수가 모자라 저장할 수 없다", () => {
		const changed = changePairCount(filledCardGame(), 12);

		expect(validateForSave("card-game", changed)).toEqual({
			isValid: false,
			issues: [expect.stringContaining("현재 10개")],
		});
	});
});
