import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import type { DataFile, DataMap, SaveResult } from "@/types/data";

type UpdateData = <F extends DataFile>(file: F, data: DataMap[F]) => Promise<SaveResult<F>>;

let stored: DataMap = createMockData("filled");
let failingFiles = new Set<DataFile>();
let invalidFiles = new Set<DataFile>();

const getData = mock(async (file: DataFile) => structuredClone(stored[file]));
const updateData = mock<UpdateData>(async (file, data) => {
	if (failingFiles.has(file)) return { isSuccess: false, reason: "io" };
	if (invalidFiles.has(file)) return { isSuccess: false, reason: "invalid", issues: ["오류"] };
	stored = { ...stored, [file]: structuredClone(data) };
	return { isSuccess: true, data: structuredClone(data) };
});

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 storage 의 export 를 모두 채웁니다
mock.module("@/data/storage", () => ({
	getAppVersion: mock(async () => "0.0.0"),
	getData,
	updateData,
	postImage: mock(),
	getImageUrl: mock((path: string) => path),
	verifyPin: mock(),
	updatePin: mock(),
	quitApp: mock(async () => {}),
}));

const {
	selectAntigenEditing,
	selectIsAntigenEditing,
	selectIsDirty,
	selectIsFileDirty,
	selectSaveIssueCount,
	useSettingsDraft,
} = await import("@/features/admin/settingsDraft");

function draft() {
	return useSettingsDraft.getState().draft;
}

function changePlayDuration(seconds: number) {
	useSettingsDraft
		.getState()
		.setDraft("common", { ...draft().common, playDurationSeconds: seconds });
}

function changePairCount() {
	const card = draft()["card-game"];
	useSettingsDraft
		.getState()
		.setDraft("card-game", { ...card, settings: { ...card.settings, pairCount: 6 } });
}

beforeEach(async () => {
	stored = createMockData("filled");
	failingFiles = new Set();
	invalidFiles = new Set();
	updateData.mockClear();
	await useSettingsDraft.getState().load();
});

describe("불러오기", () => {
	test("세 파일을 불러와 원본과 초안을 같게 둔다", () => {
		const state = useSettingsDraft.getState();
		expect(state.isLoaded).toBe(true);
		expect(state.draft).toEqual(stored);
		expect(selectIsDirty(state)).toBe(false);
	});

	test("불러오기가 실패한 파일은 기본값으로 채운다", async () => {
		getData.mockImplementationOnce(() => Promise.reject(new Error("ipc")));
		await useSettingsDraft.getState().load();
		expect(useSettingsDraft.getState().isLoaded).toBe(true);
		expect(draft().common.species).toHaveLength(0);
	});
});

describe("초안 수정", () => {
	test("값을 바꾸면 그 파일만 바뀐 상태가 된다", () => {
		changePlayDuration(30);
		const state = useSettingsDraft.getState();
		expect(selectIsDirty(state)).toBe(true);
		expect(selectIsFileDirty("common")(state)).toBe(true);
		expect(selectIsFileDirty("card-game")(state)).toBe(false);
	});

	test("원래 값으로 되돌려 놓으면 바뀐 상태가 아니다", () => {
		const original = draft().common.playDurationSeconds;
		changePlayDuration(30);
		changePlayDuration(original);
		expect(selectIsDirty(useSettingsDraft.getState())).toBe(false);
	});

	test("되돌리기는 초안을 원본으로 돌린다", () => {
		changePlayDuration(30);
		useSettingsDraft.getState().revert();
		expect(selectIsDirty(useSettingsDraft.getState())).toBe(false);
		expect(draft()).toEqual(stored);
	});

	test("바뀐 파일의 저장 규칙 위반만 센다", () => {
		expect(selectSaveIssueCount(useSettingsDraft.getState())).toBe(0);
		changePairCount();
		expect(selectSaveIssueCount(useSettingsDraft.getState())).toBeGreaterThan(0);
	});
});

describe("항원 수정 상태", () => {
	function editFirstAntigen() {
		const [vaccine] = draft()["vaccine-game"].vaccines;
		const [antigen] = vaccine?.antigens ?? [];
		if (vaccine === undefined || antigen === undefined)
			throw new Error("목데이터에 항원이 없습니다");

		const editing = { vaccineId: vaccine.id, antigenId: antigen.id, isNew: false };
		useSettingsDraft.getState().setAntigenEditing(editing);
		return editing;
	}

	test("처음에는 수정 중인 항원이 없다", () => {
		expect(selectIsAntigenEditing(useSettingsDraft.getState())).toBe(false);
	});

	test("수정 중인 항원을 두면 수정 중이 된다", () => {
		const editing = editFirstAntigen();

		expect(selectAntigenEditing(useSettingsDraft.getState())).toBe(editing);
		expect(selectIsAntigenEditing(useSettingsDraft.getState())).toBe(true);
	});

	test("수정 중이던 항원이 초안에 없으면 수정 중이 아니다", () => {
		useSettingsDraft
			.getState()
			.setAntigenEditing({ vaccineId: "없는 백신", antigenId: "없는 항원", isNew: true });

		expect(selectAntigenEditing(useSettingsDraft.getState())).toBeNull();
		expect(selectIsAntigenEditing(useSettingsDraft.getState())).toBe(false);
	});

	test("되돌리면 항원 수정도 끝난다", () => {
		editFirstAntigen();
		useSettingsDraft.getState().revert();

		expect(useSettingsDraft.getState().antigenEditing).toBeNull();
	});

	test("다시 불러오면 항원 수정도 끝난다", async () => {
		editFirstAntigen();
		await useSettingsDraft.getState().load();

		expect(useSettingsDraft.getState().antigenEditing).toBeNull();
	});
});

describe("저장", () => {
	test("바뀐 파일만 쓰고, 성공하면 저장된 값이 원본이 된다", async () => {
		changePlayDuration(30);
		const isSuccess = await useSettingsDraft.getState().save();

		expect(isSuccess).toBe(true);
		expect(updateData).toHaveBeenCalledTimes(1);
		expect(updateData.mock.calls[0]?.[0]).toBe("common");
		const state = useSettingsDraft.getState();
		expect(state.original.common.playDurationSeconds).toBe(30);
		expect(selectIsDirty(state)).toBe(false);
		expect(state.isSaving).toBe(false);
	});

	test("일부만 실패하면 성공한 파일은 원본이 되고 실패한 파일은 초안으로 남는다", async () => {
		failingFiles.add("card-game");
		changePlayDuration(30);
		changePairCount();
		const isSuccess = await useSettingsDraft.getState().save();

		expect(isSuccess).toBe(false);
		const state = useSettingsDraft.getState();
		expect(selectIsFileDirty("common")(state)).toBe(false);
		expect(selectIsFileDirty("card-game")(state)).toBe(true);
		expect(state.draft["card-game"].settings.pairCount).toBe(6);
	});

	test("다시 시도하면 남은 파일만 쓴다", async () => {
		failingFiles.add("card-game");
		changePlayDuration(30);
		changePairCount();
		await useSettingsDraft.getState().save();

		failingFiles.clear();
		updateData.mockClear();
		const isSuccess = await useSettingsDraft.getState().save();

		expect(isSuccess).toBe(true);
		expect(updateData.mock.calls.map(([file]) => file)).toEqual(["card-game"]);
		expect(selectIsDirty(useSettingsDraft.getState())).toBe(false);
	});

	test("저장이 겹쳐 불려도 바뀐 파일을 한 번만 쓴다", async () => {
		changePlayDuration(30);
		changePairCount();
		const store = useSettingsDraft.getState();
		const results = await Promise.all([store.save(), store.save()]);

		expect(results).toEqual([true, true]);
		expect(updateData.mock.calls.map(([file]) => file).sort()).toEqual(["card-game", "common"]);
	});

	test("저장하는 동안 다시 고친 파일은 새 초안을 남긴다", async () => {
		let finishSave: () => void = () => {};
		updateData.mockImplementationOnce(async (_file, data) => {
			await new Promise<void>((resolve) => {
				finishSave = resolve;
			});
			return { isSuccess: true, data: structuredClone(data) };
		});
		changePlayDuration(30);
		const saving = useSettingsDraft.getState().save();
		changePlayDuration(45);
		finishSave();
		await saving;

		const state = useSettingsDraft.getState();
		expect(state.original.common.playDurationSeconds).toBe(30);
		expect(state.draft.common.playDurationSeconds).toBe(45);
		expect(selectIsFileDirty("common")(state)).toBe(true);
	});

	test("저장 규칙에 걸려 거부되면 실패로 보고 초안을 남긴다", async () => {
		invalidFiles.add("common");
		changePlayDuration(30);
		const isSuccess = await useSettingsDraft.getState().save();

		expect(isSuccess).toBe(false);
		expect(draft().common.playDurationSeconds).toBe(30);
		expect(selectIsDirty(useSettingsDraft.getState())).toBe(true);
	});

	test("저장 중 예외가 나도 실패로 보고 초안을 남긴다", async () => {
		updateData.mockImplementationOnce(() => Promise.reject(new Error("ipc")));
		changePlayDuration(30);
		const isSuccess = await useSettingsDraft.getState().save();

		expect(isSuccess).toBe(false);
		expect(useSettingsDraft.getState().isSaving).toBe(false);
		expect(selectIsDirty(useSettingsDraft.getState())).toBe(true);
	});
});
