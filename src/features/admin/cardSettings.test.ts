import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import { getLimitNotice, getUsageNotice } from "@/features/admin/cardSettings";
import { changePairCount, disableProduct } from "@/features/admin/productSlots";
import type { CardGameData } from "@/types/data";

function filledCardGame(): CardGameData {
	return createMockData("filled")["card-game"];
}

function emptyCardGame(): CardGameData {
	return createMockData("empty")["card-game"];
}

describe("getUsageNotice", () => {
	test("쌍 수만큼 켜져 있으면 안내하지 않는다", () => {
		expect(getUsageNotice(filledCardGame())).toBeNull();
	});

	test("등록된 제품이 없으면 앰버로 등록할 개수를 알린다 (빈 상태)", () => {
		expect(getUsageNotice(emptyCardGame())).toEqual({
			tone: "info",
			message: "제품 8개를 더 등록해 주세요.",
		});
	});

	test("등록된 제품이 있는데 켠 수가 모자라면 빨강으로 모자란 개수를 알린다", () => {
		const data = disableProduct(filledCardGame(), 3);

		expect(getUsageNotice(data)).toEqual({
			tone: "error",
			message: "켜진 제품이 1개 모자랍니다. 1개를 더 켜 주세요.",
		});
	});

	test("제품을 등록했지만 모두 끈 경우는 빈 상태가 아니라 모자람이다", () => {
		const data = filledCardGame();
		const allDisabled = {
			...data,
			products: data.products.map((product) => ({ ...product, isEnabled: false })),
		};

		expect(getUsageNotice(allDisabled)?.tone).toBe("error");
	});

	test("등록한 제품이 쌍 수보다 적으면 켜기가 아니라 등록을 알린다", () => {
		// 목데이터는 10개 등록·8개 켬이라 12쌍이면 등록이 2개 모자랍니다
		const data = changePairCount(filledCardGame(), 12);

		expect(getUsageNotice(data)).toEqual({
			tone: "error",
			message: "제품 2개를 더 등록해 주세요.",
		});
	});

	test("켠 제품이 모두 결과 화면 표시를 끄면 1개 이상 고르라고 알린다", () => {
		const data = filledCardGame();
		const allHidden = {
			...data,
			products: data.products.map((product) => ({ ...product, isShownInResult: false })),
		};

		expect(getUsageNotice(allHidden)).toEqual({
			tone: "error",
			message: "결과 화면에 보여 줄 제품을 1개 이상 골라 주세요.",
		});
	});
});

describe("getLimitNotice", () => {
	test("쌍 수만큼 이미 켰다고 앰버로 알린다", () => {
		expect(getLimitNotice(8)).toEqual({
			tone: "info",
			message: "이미 8개를 모두 켰습니다. 다른 제품을 끈 뒤 켜 주세요.",
		});
	});
});
