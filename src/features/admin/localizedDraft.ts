import { getImageUrl } from "@/data/storage";
import type { ImagePath, Localized } from "@/types/data";

/** KR·EN 이 모두 채워져야 값이 됩니다. 한쪽이라도 비었으면 undefined */
export function toCompleteLocalized<T extends string>({
	ko,
	en,
}: Partial<Localized<T>>): Localized<T> | undefined {
	return ko && en ? { ko, en } : undefined;
}

/** 고르는 중인 사진의 화면 주소. 아직 고르지 않은 칸은 비어 있습니다 */
export function toImageSrcs({ ko, en }: Partial<Localized<ImagePath>>): Partial<Localized<string>> {
	return { ko: ko && getImageUrl(ko), en: en && getImageUrl(en) };
}
