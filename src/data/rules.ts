import { dataSchemas, LIMITS } from "@/data/schema";
import type {
	Antigen,
	CardGameData,
	CommonData,
	DataFile,
	DataMap,
	PathogenType,
	Vaccine,
	VaccineGameData,
} from "@/types/data";

// 설정 저장 규칙 (Notion 데이터구조 › 7. 저장 규칙)
// 관리자 화면은 저장 버튼 비활성과 InlineNotice 문구에, main 은 updateData 재검사에 같은 함수를 씁니다

export type ValidationResult<F extends DataFile> =
	| { isValid: true; data: DataMap[F] }
	| { isValid: false; issues: string[] };

/** 앞뒤 공백 제거, 공백만 있는 세부 타입은 null. 저장 직전에 한 번 거칩니다 */
export function normalizeData<F extends DataFile>(file: F, data: DataMap[F]): DataMap[F] {
	switch (file) {
		case "common":
			return normalizeCommon(data as CommonData) as DataMap[F];
		case "vaccine-game":
			return normalizeVaccineGame(data as VaccineGameData) as DataMap[F];
		default:
			return data;
	}
}

/** 모양 검사 → 정리 → 저장 규칙 순서로 확인합니다 */
export function validateForSave<F extends DataFile>(file: F, data: unknown): ValidationResult<F> {
	const parsed = dataSchemas[file].safeParse(data);
	if (!parsed.success) {
		return {
			isValid: false,
			issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
		};
	}

	const normalized = normalizeData(file, parsed.data as DataMap[F]);
	const issues = collectSaveIssues(file, normalized);
	return issues.length === 0 ? { isValid: true, data: normalized } : { isValid: false, issues };
}

export function collectSaveIssues<F extends DataFile>(file: F, data: DataMap[F]): string[] {
	switch (file) {
		case "common":
			return collectCommonIssues(data as CommonData);
		case "vaccine-game":
			return collectVaccineGameIssues(data as VaccineGameData);
		case "card-game":
			return collectCardGameIssues(data as CardGameData);
		default:
			return [];
	}
}

/** 저장은 막지 않는 경고. 힌트 시간이 제한 시간(스토어에 저장된 값) 이상인지 봅니다 */
export function isHintDelayTooLong(data: VaccineGameData, playDurationSeconds: number): boolean {
	return data.settings.hint.isEnabled && data.settings.hint.delaySeconds >= playDurationSeconds;
}

/** 화면 표시용 이름. 세부 타입이 있으면 "AI Y280", 없으면 "AI" */
export function formatAntigenLabel(antigen: Pick<Antigen, "abbr" | "subtype">): string {
	return antigen.subtype === null ? antigen.abbr : `${antigen.abbr} ${antigen.subtype}`;
}

/** 약어와 세부 타입을 합친 구별 값. 색 배정, 정답 판정, 중복 검사에 같이 씁니다 */
export function antigenKey(antigen: Pick<Antigen, "abbr" | "subtype">): string {
	return `${antigen.abbr}::${antigen.subtype ?? ""}`;
}

// ---------------------------------------------------------------- normalize

function normalizeSubtype(subtype: string | null): string | null {
	const trimmed = subtype?.trim() ?? "";
	return trimmed === "" ? null : trimmed;
}

function normalizeCommon(data: CommonData): CommonData {
	return {
		...data,
		species: data.species.map((species) => ({ ...species, name: species.name.trim() })),
	};
}

function normalizeVaccine(vaccine: Vaccine): Vaccine {
	return {
		...vaccine,
		brandName: { ko: vaccine.brandName.ko.trim(), en: vaccine.brandName.en.trim() },
		productName: { ko: vaccine.productName.ko.trim(), en: vaccine.productName.en.trim() },
		antigens: vaccine.antigens.map((antigen) => ({
			...antigen,
			abbr: antigen.abbr.trim(),
			subtype: normalizeSubtype(antigen.subtype),
		})),
	};
}

function normalizeVaccineGame(data: VaccineGameData): VaccineGameData {
	return { ...data, vaccines: data.vaccines.map(normalizeVaccine) };
}

// ------------------------------------------------------------------ issues

function collectCommonIssues(data: CommonData): string[] {
	const issues: string[] = [];
	const { min, max } = LIMITS.speciesName;

	const names = new Set<string>();
	for (const species of data.species) {
		if (species.name.length < min || species.name.length > max) {
			issues.push(`축종명은 ${min}~${max}자로 입력해 주세요. (${species.name || "빈 이름"})`);
		}
		if (names.has(species.name)) {
			issues.push(`같은 이름의 축종이 있습니다. (${species.name})`);
		}
		names.add(species.name);
	}

	if (data.homeAnimals.length > LIMITS.homeAnimals.max) {
		issues.push(`메인 화면 동물은 ${LIMITS.homeAnimals.max}칸까지 둘 수 있습니다.`);
	}
	const slots = new Set(data.homeAnimals.map((animal) => animal.slot));
	if (slots.size !== data.homeAnimals.length) {
		issues.push("메인 화면 동물 칸이 겹칩니다.");
	}
	const speciesIds = new Set(data.species.map((species) => species.id));
	if (data.homeAnimals.some((animal) => !speciesIds.has(animal.speciesId))) {
		issues.push("메인 화면 동물에 등록되지 않은 축종이 있습니다.");
	}

	return issues;
}

function collectVaccineGameIssues(data: VaccineGameData): string[] {
	const issues: string[] = [];
	const enabled = LIMITS.enabledVaccines;
	const perVaccine = LIMITS.antigensPerVaccine;

	const enabledCount = data.vaccines.filter((vaccine) => vaccine.isEnabled).length;
	if (enabledCount < enabled.min || enabledCount > enabled.max) {
		issues.push(`게임에 쓸 백신을 ${enabled.min}~${enabled.max}개 체크해 주세요.`);
	}

	for (const vaccine of data.vaccines) {
		const label = vaccine.productName.ko || "이름 없는 백신";
		const texts = [
			vaccine.brandName.ko,
			vaccine.brandName.en,
			vaccine.productName.ko,
			vaccine.productName.en,
		];
		if (texts.some((text) => text === "")) {
			issues.push(`${label}: 브랜드명과 제품명(한, 영)을 모두 입력해 주세요.`);
		}

		const count = vaccine.antigens.length;
		if (count < perVaccine.min || count > perVaccine.max) {
			issues.push(`${label}: 항원은 ${perVaccine.min}~${perVaccine.max}개여야 합니다.`);
		}
		if (vaccine.antigens.some((antigen) => antigen.abbr === "")) {
			issues.push(`${label}: 항원 약어를 입력해 주세요.`);
		}
		if (vaccine.antigens.some((antigen) => antigen.abbr.length > LIMITS.antigenAbbr.max)) {
			issues.push(`${label}: 항원 약어는 ${LIMITS.antigenAbbr.max}자 이하로 입력해 주세요.`);
		}
		const keys = new Set(vaccine.antigens.map(antigenKey));
		if (keys.size !== count) {
			issues.push(`${label}: 약어와 세부 타입이 같은 항원이 있습니다.`);
		}
		if (count > 0 && vaccine.antigens.every((antigen) => antigen.isPinned)) {
			issues.push(`${label}: 고정하지 않은 항원이 1개 이상 있어야 합니다.`);
		}
	}

	issues.push(...collectPathogenTypeIssues(data.vaccines));
	return issues;
}

/** 약어가 같은 항원은 백신이 달라도 병원체 종류가 같아야 합니다 */
function collectPathogenTypeIssues(vaccines: Vaccine[]): string[] {
	const typesByAbbr = new Map<string, Set<PathogenType>>();
	for (const antigen of vaccines.flatMap((vaccine) => vaccine.antigens)) {
		const types = typesByAbbr.get(antigen.abbr) ?? new Set<PathogenType>();
		types.add(antigen.pathogenType);
		typesByAbbr.set(antigen.abbr, types);
	}
	return [...typesByAbbr]
		.filter(([abbr, types]) => abbr !== "" && types.size > 1)
		.map(([abbr]) => `${abbr}: 같은 약어의 항원은 세균, 바이러스 구분이 같아야 합니다.`);
}

function collectCardGameIssues(data: CardGameData): string[] {
	const issues: string[] = [];
	const { pairCount } = data.settings;

	if (data.products.some((product) => product.isEnabled && product.image === null)) {
		issues.push("빈 칸은 켤 수 없습니다.");
	}
	const enabled = data.products.filter((product) => product.isEnabled);
	if (enabled.length !== pairCount) {
		issues.push(
			`카드 ${pairCount}쌍에 맞게 제품을 ${pairCount}개 켜 주세요. (현재 ${enabled.length}개)`,
		);
	}
	if (!enabled.some((product) => product.isShownInResult)) {
		issues.push("켜진 제품 중 결과 화면에 보여 줄 제품을 1개 이상 골라 주세요.");
	}

	return issues;
}
