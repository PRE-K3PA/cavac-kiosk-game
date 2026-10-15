import { create } from "zustand";
import { createDefaultData } from "@/data/defaults";
import { validateForSave } from "@/data/rules";
import { getData, updateData } from "@/data/storage";
import { DATA_FILES, type DataFile, type DataMap } from "@/types/data";

// 관리자 10~12 화면이 함께 고치는 설정 초안. 저장 전까지는 파일에 쓰지 않습니다

type SettingsDraftState = {
	isLoaded: boolean;
	isSaving: boolean;
	original: DataMap;
	draft: DataMap;
	load: () => Promise<void>;
	setDraft: <F extends DataFile>(file: F, data: DataMap[F]) => void;
	revert: () => void;
	/** 바뀐 파일만 씁니다. 하나라도 실패하면 false 이고, 성공한 파일만 원본이 됩니다 */
	save: () => Promise<boolean>;
};

function createDefaultDataMap(): DataMap {
	return {
		common: createDefaultData("common"),
		"vaccine-game": createDefaultData("vaccine-game"),
		"card-game": createDefaultData("card-game"),
	};
}

async function loadFile<F extends DataFile>(file: F): Promise<DataMap[F]> {
	try {
		return await getData(file);
	} catch {
		return createDefaultData(file);
	}
}

function isSameValue(a: unknown, b: unknown): boolean {
	if (a === b) return true;
	if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;

	const aRecord = a as Record<string, unknown>;
	const bRecord = b as Record<string, unknown>;
	const keys = Object.keys(aRecord);
	if (keys.length !== Object.keys(bRecord).length) return false;
	return keys.every((key) => key in bRecord && isSameValue(aRecord[key], bRecord[key]));
}

function isFileDirty(state: Pick<SettingsDraftState, "original" | "draft">, file: DataFile) {
	return !isSameValue(state.original[file], state.draft[file]);
}

function getDirtyFiles(state: Pick<SettingsDraftState, "original" | "draft">): DataFile[] {
	return DATA_FILES.filter((file) => isFileDirty(state, file));
}

async function saveFile<F extends DataFile>(file: F, data: DataMap[F]) {
	try {
		return await updateData(file, data);
	} catch {
		return { isSuccess: false, reason: "io" } as const;
	}
}

function replaceFile<F extends DataFile>(target: DataMap, file: F, data: DataMap[F]) {
	target[file] = data;
}

// 저장이 겹쳐 불려도 같은 파일을 두 번 쓰지 않게, 진행 중인 저장을 함께 기다립니다
let pendingSave: Promise<boolean> | null = null;

export const useSettingsDraft = create<SettingsDraftState>()((set, get) => {
	async function saveDirtyFiles(): Promise<boolean> {
		const sent = get().draft;
		const files = getDirtyFiles(get());
		set({ isSaving: true });

		const results = await Promise.all(
			files.map(async (file) => ({ file, result: await saveFile(file, sent[file]) })),
		);

		set((state) => {
			const original = { ...state.original };
			const draft = { ...state.draft };
			for (const { file, result } of results) {
				if (!result.isSuccess) continue;
				replaceFile(original, file, result.data);
				// 저장하는 동안 다시 고친 파일은 그 초안을 남깁니다
				if (state.draft[file] === sent[file]) replaceFile(draft, file, result.data);
			}
			return { isSaving: false, original, draft };
		});

		return results.every(({ result }) => result.isSuccess);
	}

	return {
		isLoaded: false,
		isSaving: false,
		original: createDefaultDataMap(),
		draft: createDefaultDataMap(),

		load: async () => {
			set({ isLoaded: false });
			const [common, vaccineGame, cardGame] = await Promise.all([
				loadFile("common"),
				loadFile("vaccine-game"),
				loadFile("card-game"),
			]);
			const loaded = { common, "vaccine-game": vaccineGame, "card-game": cardGame };
			set({ isLoaded: true, original: loaded, draft: loaded });
		},

		setDraft: (file, data) => {
			set((state) => ({ draft: { ...state.draft, [file]: data } }));
		},

		revert: () => {
			set((state) => ({ draft: state.original }));
		},

		save: () => {
			pendingSave ??= saveDirtyFiles().finally(() => {
				pendingSave = null;
			});
			return pendingSave;
		},
	};
});

export function selectIsDirty(state: SettingsDraftState): boolean {
	return getDirtyFiles(state).length > 0;
}

export function selectIsFileDirty(file: DataFile) {
	return (state: SettingsDraftState): boolean => isFileDirty(state, file);
}

/**
 * 바뀐 파일의 저장 규칙 위반 개수. 바꾸지 않은 파일은 쓰지 않으므로 세지 않습니다.
 * main 이 저장 전에 하는 검사(validateForSave)와 같아야 저장 실패가 반복되지 않습니다
 */
export function selectSaveIssueCount(state: SettingsDraftState): number {
	return getDirtyFiles(state).reduce((count, file) => {
		const validation = validateForSave(file, state.draft[file]);
		return validation.isValid ? count : count + validation.issues.length;
	}, 0);
}
