import { LIMITS } from "@/data/schema";
import type { Vaccine, VaccineGameData } from "@/types/data";

const MAX_ENABLED = LIMITS.enabledVaccines.max;

export type EnableVaccineResult =
	| { isSuccess: true; data: VaccineGameData }
	| { isSuccess: false; reason: "limit" };

/** 백신 추가·수정 모달에서 정하는 값 */
export type VaccineInfo = Pick<Vaccine, "brandName" | "productName" | "bottleImage" | "logoImage">;

export function countEnabledVaccines(vaccines: Vaccine[]): number {
	return vaccines.filter((vaccine) => vaccine.isEnabled).length;
}

/** 행에 보이는 제품명(KR·EN)으로만 찾습니다. 앞뒤 공백과 영문 대소문자는 무시합니다 */
export function filterVaccines(vaccines: Vaccine[], query: string): Vaccine[] {
	const keyword = query.trim().toLowerCase();
	if (keyword === "") return vaccines;

	return vaccines.filter(({ productName }) =>
		[productName.ko, productName.en].some((name) => name.toLowerCase().includes(keyword)),
	);
}

export function enableVaccine(data: VaccineGameData, vaccineId: string): EnableVaccineResult {
	const target = data.vaccines.find((vaccine) => vaccine.id === vaccineId);
	if (target === undefined || target.isEnabled) return { isSuccess: true, data };
	if (countEnabledVaccines(data.vaccines) >= MAX_ENABLED) {
		return { isSuccess: false, reason: "limit" };
	}

	return {
		isSuccess: true,
		data: updateVaccine(data, vaccineId, (vaccine) => ({ ...vaccine, isEnabled: true })),
	};
}

export function disableVaccine(data: VaccineGameData, vaccineId: string): VaccineGameData {
	return updateVaccine(data, vaccineId, (vaccine) => ({ ...vaccine, isEnabled: false }));
}

/** 목록 끝에 항원 없이 넣습니다. 사용 백신이 한도(5개)보다 적으면 켜고, 꽉 찼으면 꺼진 채로 둡니다 */
export function addVaccine(data: VaccineGameData, info: VaccineInfo): VaccineGameData {
	const vaccine: Vaccine = {
		...pickVaccineInfo(info),
		id: crypto.randomUUID(),
		isEnabled: countEnabledVaccines(data.vaccines) < MAX_ENABLED,
		antigens: [],
	};
	return { ...data, vaccines: [...data.vaccines, vaccine] };
}

export function updateVaccineInfo(
	data: VaccineGameData,
	vaccineId: string,
	info: VaccineInfo,
): VaccineGameData {
	return updateVaccine(data, vaccineId, (vaccine) => ({ ...vaccine, ...pickVaccineInfo(info) }));
}

export function deleteVaccine(data: VaccineGameData, vaccineId: string): VaccineGameData {
	return { ...data, vaccines: data.vaccines.filter((vaccine) => vaccine.id !== vaccineId) };
}

/** 모달이 더 많은 필드를 넘겨도 사용·항원을 덮어쓰지 않게 이름과 이미지만 꺼냅니다 */
function pickVaccineInfo({
	brandName,
	productName,
	bottleImage,
	logoImage,
}: VaccineInfo): VaccineInfo {
	return { brandName, productName, bottleImage, logoImage };
}

function updateVaccine(
	data: VaccineGameData,
	vaccineId: string,
	update: (vaccine: Vaccine) => Vaccine,
): VaccineGameData {
	const vaccines = data.vaccines.map((vaccine) =>
		vaccine.id === vaccineId ? update(vaccine) : vaccine,
	);
	return { ...data, vaccines };
}
