import type { VaccineInfo } from "@/features/admin/vaccineList";
import type { ImageKind, ImagePath, Language, Localized, Vaccine } from "@/types/data";

export type VaccineName = Pick<Vaccine, "brandName" | "productName">;
export type VaccineNameKey = keyof VaccineName;
export type VaccineImageKey = keyof Pick<Vaccine, "bottleImage" | "logoImage">;

/** 추가·수정 모달에서 고르는 중인 사진. 아직 고르지 않은 칸은 비어 있습니다 */
export type VaccineImageDraft = Record<VaccineImageKey, Partial<Localized<ImagePath>>>;

/** 사진 4장을 useImageSelect 하나로 고르려고 이미지 종류와 언어를 합친 칸 키입니다 */
export type VaccineImageField = `${VaccineImageKey}.${Language}`;

export const LANGUAGE_LABELS = { ko: "KR", en: "EN" } satisfies Record<Language, string>;

export const VACCINE_IMAGE_KINDS = {
	bottleImage: "vaccine-bottle",
	logoImage: "vaccine-logo",
} as const satisfies Record<VaccineImageKey, ImageKind>;

const NAME_LABELS = {
	brandName: "브랜드명",
	productName: "제품명",
} satisfies Record<VaccineNameKey, string>;

export const EMPTY_VACCINE_NAME: VaccineName = {
	brandName: { ko: "", en: "" },
	productName: { ko: "", en: "" },
};

export const EMPTY_VACCINE_IMAGES: VaccineImageDraft = { bottleImage: {}, logoImage: {} };

/**
 * 공백만 입력한 칸의 오류 문구입니다 (Figma VaccineAddOverlay_NameBlank).
 * 빈 칸은 아직 입력하지 않은 것이라 문구 없이 "확인" 만 막습니다
 */
export function getBlankNameErrors(
	name: VaccineName,
): Record<VaccineNameKey, Partial<Localized<string>>> {
	return {
		brandName: getBlankMessages(name, "brandName"),
		productName: getBlankMessages(name, "productName"),
	};
}

/** 8칸이 모두 차 있으면 이름의 앞뒤 공백을 지운 값을, 하나라도 비었거나 공백뿐이면 undefined */
export function toVaccineInfo(
	name: VaccineName,
	images: VaccineImageDraft,
): VaccineInfo | undefined {
	const brandName = toComplete(trimLocalized(name.brandName));
	const productName = toComplete(trimLocalized(name.productName));
	const bottleImage = toComplete(images.bottleImage);
	const logoImage = toComplete(images.logoImage);
	if (!brandName || !productName || !bottleImage || !logoImage) return undefined;

	return { brandName, productName, bottleImage, logoImage };
}

function getBlankMessages(name: VaccineName, key: VaccineNameKey): Partial<Localized<string>> {
	return { ko: getBlankMessage(name, key, "ko"), en: getBlankMessage(name, key, "en") };
}

function getBlankMessage(
	name: VaccineName,
	key: VaccineNameKey,
	language: Language,
): string | undefined {
	const text = name[key][language];
	if (text === "" || text.trim() !== "") return undefined;
	return `${LANGUAGE_LABELS[language]} ${NAME_LABELS[key]}: 공백만 입력할 수 없습니다.`;
}

function trimLocalized({ ko, en }: Localized<string>): Localized<string> {
	return { ko: ko.trim(), en: en.trim() };
}

/** KR·EN 이 모두 채워져야 값이 됩니다 */
function toComplete({ ko, en }: Partial<Localized<string>>): Localized<string> | undefined {
	return ko && en ? { ko, en } : undefined;
}
