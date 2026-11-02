import { describe, expect, test } from "bun:test";
import {
	EMPTY_VACCINE_IMAGES,
	EMPTY_VACCINE_NAME,
	getBlankNameErrors,
	toVaccineInfo,
	type VaccineImageDraft,
	type VaccineName,
} from "@/features/admin/vaccineForm";

const NAME: VaccineName = {
	brandName: { ko: "포울샷", en: "PoulShot" },
	productName: { ko: "5280 ABBNE", en: "5280 ABBNE" },
};

const IMAGES = {
	bottleImage: {
		ko: "images/vaccine-bottle/00000000-0000-4000-8000-000000000001.png",
		en: "images/vaccine-bottle/00000000-0000-4000-9000-000000000001.png",
	},
	logoImage: {
		ko: "images/vaccine-logo/00000000-0000-4000-8000-000000000001.png",
		en: "images/vaccine-logo/00000000-0000-4000-9000-000000000001.png",
	},
} satisfies VaccineImageDraft;

describe("getBlankNameErrors", () => {
	test("빈 칸과 글자가 있는 칸에는 문구가 없다", () => {
		const errors = getBlankNameErrors({
			brandName: { ko: "", en: " PoulShot " },
			productName: NAME.productName,
		});

		expect(errors).toEqual({ brandName: {}, productName: {} });
	});

	test("공백만 입력한 칸은 언어와 칸 이름을 붙여 알린다", () => {
		const errors = getBlankNameErrors({
			brandName: { ko: "   ", en: "PoulShot" },
			productName: { ko: "5280 ABBNE", en: " " },
		});

		expect(errors.brandName.ko).toBe("KR 브랜드명: 공백만 입력할 수 없습니다.");
		expect(errors.brandName.en).toBeUndefined();
		expect(errors.productName.ko).toBeUndefined();
		expect(errors.productName.en).toBe("EN 제품명: 공백만 입력할 수 없습니다.");
	});

	test("한 칸의 KR·EN 이 모두 공백뿐이면 문구도 둘", () => {
		const errors = getBlankNameErrors({ ...NAME, brandName: { ko: " ", en: "  " } });

		expect(errors.brandName).toEqual({
			ko: "KR 브랜드명: 공백만 입력할 수 없습니다.",
			en: "EN 브랜드명: 공백만 입력할 수 없습니다.",
		});
		expect(errors.productName).toEqual({});
	});
});

describe("toVaccineInfo", () => {
	test("8칸이 모두 차면 이름의 앞뒤 공백을 지운 값", () => {
		const padded: VaccineName = {
			brandName: { ko: " 포울샷 ", en: "PoulShot " },
			productName: { ko: "5280 ABBNE", en: "  5280 ABBNE" },
		};

		expect(toVaccineInfo(padded, IMAGES)).toEqual({ ...NAME, ...IMAGES });
	});

	test("빈 모달은 값이 없다", () => {
		expect(toVaccineInfo(EMPTY_VACCINE_NAME, EMPTY_VACCINE_IMAGES)).toBeUndefined();
	});

	test("이름이 하나라도 비었거나 공백뿐이면 값이 없다", () => {
		const emptyBrand = { ...NAME, brandName: { ko: "포울샷", en: "" } };
		const blankProduct = { ...NAME, productName: { ko: "  ", en: "5280 ABBNE" } };

		expect(toVaccineInfo(emptyBrand, IMAGES)).toBeUndefined();
		expect(toVaccineInfo(blankProduct, IMAGES)).toBeUndefined();
	});

	test("사진이 하나라도 없으면 값이 없다", () => {
		const withoutEnLogo = { ...IMAGES, logoImage: { ko: IMAGES.logoImage.ko } };
		const withoutKoBottle = { ...IMAGES, bottleImage: { en: IMAGES.bottleImage.en } };

		expect(toVaccineInfo(NAME, withoutEnLogo)).toBeUndefined();
		expect(toVaccineInfo(NAME, withoutKoBottle)).toBeUndefined();
	});
});
