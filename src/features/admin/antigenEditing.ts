import { antigenKey } from "@/data/rules";
import { LIMITS } from "@/data/schema";
import type { UsageNotice } from "@/features/admin/usageNotice";
import type { Antigen, VaccineGameData } from "@/types/data";

const MAX_ABBR_LENGTH = LIMITS.antigenAbbr.max;

// 저장 규칙(src/data/rules.ts)과 같은 문장입니다. 저장 규칙은 앞에 백신 이름이나 약어를 붙입니다
export const ANTIGEN_ERROR_MESSAGES = {
	empty: "항원 약어를 입력해 주세요.",
	tooLong: `항원 약어는 ${MAX_ABBR_LENGTH}자 이하로 입력해 주세요.`,
	duplicate: "약어와 세부 타입이 같은 항원이 있습니다.",
	allPinned: "고정하지 않은 항원이 1개 이상 있어야 합니다.",
	pathogenMismatch: "같은 약어의 항원은 세균, 바이러스 구분이 같아야 합니다.",
} as const;

export type AntigenError = keyof typeof ANTIGEN_ERROR_MESSAGES;

/** 마지막 남은 고정 안 된 항원을 고정하려 할 때 잠깐 보여 주는 안내입니다 (10-27 실기 테스트 QA) */
export const ANTIGEN_PIN_NOTICE: UsageNotice = {
	tone: "info",
	message: ANTIGEN_ERROR_MESSAGES.allPinned,
};

export type ToggleAntigenPinResult =
	| { isSuccess: true; data: VaccineGameData }
	| { isSuccess: false; reason: "allPinned" };

/**
 * 수정 중인 항원 행. 설정 파일에 넣지 않는 화면 상태이고, 한 번에 한 행만 둡니다 (Figma Q12).
 * 수정 중에는 다른 항원 행의 고정·수정·삭제와 항원 추가를 이 파일의 함수가 막습니다.
 * 백신 목록 조작(펼치기·접기, 검색, 사용 체크, 백신 추가·수정·삭제)은 화면이 disabled 로 막습니다
 */
export type AntigenEditing = {
	vaccineId: string;
	antigenId: string;
	/** 항원 추가로 생긴 행. 지우면 확인 없이 추가를 취소합니다 */
	isNew: boolean;
};

/** 입력은 바로 설정 초안에 들어가므로, 항원을 고치는 함수는 초안과 수정 상태를 함께 돌려줍니다 */
export type AntigenEditState = {
	data: VaccineGameData;
	editing: AntigenEditing | null;
};

/** 백신 행은 한 번에 하나만 펼칩니다 */
export function toggleExpandedVaccine(
	expandedVaccineId: string | null,
	vaccineId: string,
): string | null {
	return expandedVaccineId === vaccineId ? null : vaccineId;
}

/** 변경 취소 등으로 수정 중인 항원이 초안에서 사라졌으면 수정 중이 아닌 것으로 봅니다 */
export function getAntigenEditing(
	data: VaccineGameData,
	editing: AntigenEditing | null,
): AntigenEditing | null {
	if (editing === null) return null;
	return findAntigen(data, editing.vaccineId, editing.antigenId) === undefined ? null : editing;
}

export function addAntigen(state: AntigenEditState, vaccineId: string): AntigenEditState {
	const vaccine = state.data.vaccines.find((item) => item.id === vaccineId);
	if (currentEditing(state) !== null || vaccine === undefined) return state;
	if (vaccine.antigens.length >= LIMITS.antigensPerVaccine.max) return state;

	const antigen: Antigen = {
		id: crypto.randomUUID(),
		abbr: "",
		subtype: null,
		pathogenType: "virus",
		isPinned: false,
	};
	return {
		data: updateAntigens(state.data, vaccineId, (antigens) => [...antigens, antigen]),
		editing: { vaccineId, antigenId: antigen.id, isNew: true },
	};
}

export function startAntigenEdit(
	state: AntigenEditState,
	vaccineId: string,
	antigenId: string,
): AntigenEditState {
	if (currentEditing(state) !== null) return state;
	if (findAntigen(state.data, vaccineId, antigenId) === undefined) return state;

	return { ...state, editing: { vaccineId, antigenId, isNew: false } };
}

export function changeAntigen(
	state: AntigenEditState,
	nextAntigen: Omit<Antigen, "id">,
): AntigenEditState {
	const editing = currentEditing(state);
	if (editing === null) return state;

	const data = updateAntigens(state.data, editing.vaccineId, (antigens) =>
		antigens.map((antigen) =>
			antigen.id === editing.antigenId ? { ...nextAntigen, id: antigen.id } : antigen,
		),
	);
	return { data, editing };
}

/**
 * 고정은 수정을 누르지 않고 바로 바꿉니다. 다른 행을 수정하는 동안(Q12)에는 바꾸지 않고,
 * 백신의 항원이 모두 고정되는 고정은 거절합니다 (10-27 실기 테스트 QA)
 */
export function toggleAntigenPin(
	state: AntigenEditState,
	vaccineId: string,
	antigenId: string,
): ToggleAntigenPinResult {
	const { data } = state;
	const editing = currentEditing(state);
	const vaccine = data.vaccines.find((item) => item.id === vaccineId);
	const target = vaccine?.antigens.find((antigen) => antigen.id === antigenId);
	if (vaccine === undefined || target === undefined) return { isSuccess: true, data };
	if (editing !== null && editing.antigenId !== antigenId) return { isSuccess: true, data };

	const othersPinned = vaccine.antigens.every(
		(antigen) => antigen.id === antigenId || antigen.isPinned,
	);
	if (!target.isPinned && othersPinned) return { isSuccess: false, reason: "allPinned" };

	return {
		isSuccess: true,
		data: updateAntigens(data, vaccineId, (antigens) =>
			antigens.map((antigen) =>
				antigen.id === antigenId ? { ...antigen, isPinned: !antigen.isPinned } : antigen,
			),
		),
	};
}

/**
 * 세균·바이러스 구분 다름은 문구만 보여 주고 완료는 막지 않습니다.
 * 여러 백신에 있는 약어를 한 행씩 고칠 수 있어야 하고, 어긋난 채로 저장하는 것은 저장 규칙이 막습니다
 */
export function canFinishAntigenEdit(state: AntigenEditState): boolean {
	const editing = currentEditing(state);
	if (editing === null) return true;

	const error = getAntigenError(state.data, editing.vaccineId, editing.antigenId);
	return error === null || error === "pathogenMismatch";
}

/** 완료한 행에는 저장될 값이 보이도록, 저장 규칙이 하는 앞뒤 공백 정리를 이때 미리 합니다 */
export function finishAntigenEdit(state: AntigenEditState): AntigenEditState {
	if (!canFinishAntigenEdit(state)) return state;

	const editing = currentEditing(state);
	if (editing === null) return { ...state, editing: null };

	const data = updateAntigens(state.data, editing.vaccineId, (antigens) =>
		antigens.map((antigen) => (antigen.id === editing.antigenId ? trimAntigen(antigen) : antigen)),
	);
	return { data, editing: null };
}

/**
 * 저장 규칙(src/data/rules.ts)의 항원 규칙을 수정 중인 행 하나 기준으로 봅니다.
 * 저장 규칙처럼 앞뒤 공백을 뺀 값으로 비교합니다
 */
export function getAntigenError(
	data: VaccineGameData,
	vaccineId: string,
	antigenId: string,
): AntigenError | null {
	const vaccine = data.vaccines.find((item) => item.id === vaccineId);
	const target = vaccine?.antigens.find((antigen) => antigen.id === antigenId);
	if (vaccine === undefined || target === undefined) return null;

	const abbr = target.abbr.trim();
	if (abbr === "") return "empty";
	if (abbr.length > MAX_ABBR_LENGTH) return "tooLong";

	const key = normalizedKey(target);
	const siblings = vaccine.antigens.filter((antigen) => antigen.id !== antigenId);
	if (siblings.some((antigen) => normalizedKey(antigen) === key)) return "duplicate";
	if (vaccine.antigens.every((antigen) => antigen.isPinned)) return "allPinned";

	// 약어가 같은 항원은 백신이 달라도 병원체 종류가 같아야 합니다
	const hasPathogenMismatch = data.vaccines
		.flatMap((item) => item.antigens)
		.some(
			(antigen) =>
				antigen.id !== antigenId &&
				antigen.abbr.trim() === abbr &&
				antigen.pathogenType !== target.pathogenType,
		);
	return hasPathogenMismatch ? "pathogenMismatch" : null;
}

/** 항원 추가로 생긴 행은 확인 없이 지워 추가를 취소하고, 나머지 행은 삭제 확인을 거칩니다 */
export function needsDeleteConfirm(editing: AntigenEditing | null, antigenId: string): boolean {
	return !(editing?.isNew === true && editing.antigenId === antigenId);
}

/** 마지막 1개도 지울 수 있습니다. 항원이 0개인 백신은 저장 규칙이 막습니다 */
export function deleteAntigen(
	state: AntigenEditState,
	vaccineId: string,
	antigenId: string,
): AntigenEditState {
	const editing = currentEditing(state);
	if (editing !== null && editing.antigenId !== antigenId) return state;
	if (findAntigen(state.data, vaccineId, antigenId) === undefined) return state;

	return {
		data: updateAntigens(state.data, vaccineId, (antigens) =>
			antigens.filter((antigen) => antigen.id !== antigenId),
		),
		editing: null,
	};
}

function currentEditing(state: AntigenEditState): AntigenEditing | null {
	return getAntigenEditing(state.data, state.editing);
}

/** 저장 규칙(normalizeData)과 같은 정리. 공백만 있는 세부 타입은 없음(null)입니다 */
function trimAntigen(antigen: Antigen): Antigen {
	return { ...antigen, abbr: antigen.abbr.trim(), subtype: antigen.subtype?.trim() || null };
}

function normalizedKey(antigen: Antigen): string {
	return antigenKey(trimAntigen(antigen));
}

function findAntigen(
	data: VaccineGameData,
	vaccineId: string,
	antigenId: string,
): Antigen | undefined {
	return data.vaccines
		.find((vaccine) => vaccine.id === vaccineId)
		?.antigens.find((antigen) => antigen.id === antigenId);
}

function updateAntigens(
	data: VaccineGameData,
	vaccineId: string,
	update: (antigens: Antigen[]) => Antigen[],
): VaccineGameData {
	const vaccines = data.vaccines.map((vaccine) =>
		vaccine.id === vaccineId ? { ...vaccine, antigens: update(vaccine.antigens) } : vaccine,
	);
	return { ...data, vaccines };
}
