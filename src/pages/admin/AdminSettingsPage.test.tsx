import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMockData } from "@/data/mock/mock-platform";
import * as storage from "@/data/storage";
import { OrientationProvider } from "@/layout/OrientationContext";
import type { DataFile, DataMap, SaveResult } from "@/types/data";

type UpdateData = <F extends DataFile>(file: F, data: DataMap[F]) => Promise<SaveResult<F>>;

const stored = createMockData("filled");

const getData = mock(async (file: DataFile) => structuredClone(stored[file]));
const updateData = mock<UpdateData>(async (_file, data) => ({ isSuccess: true, data }));
const quitApp = mock(async () => {});

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getData,
	updateData,
	quitApp,
}));

const { selectIsDirty, useSettingsDraft } = await import("@/features/admin/settingsDraft");
const { default: AdminSettingsPage } = await import("@/pages/admin/AdminSettingsPage");

const CONTENTS = { common: <p>공통 설정 내용</p>, vaccine: null, card: null };

beforeEach(() => {
	for (const fn of [getData, updateData, quitApp]) fn.mockClear();
});

afterEach(() => {
	cleanup();
});

async function renderPage() {
	const onExit = mock(() => {});
	render(
		<OrientationProvider orientation="landscape">
			<AdminSettingsPage contents={CONTENTS} onExit={onExit} />
		</OrientationProvider>,
	);
	await screen.findByText("공통 설정 내용");
	return { onExit };
}

function changeDraft() {
	act(() => {
		const { draft, setDraft } = useSettingsDraft.getState();
		const seconds = draft.common.playDurationSeconds;
		setDraft("common", { ...draft.common, playDurationSeconds: seconds === 30 ? 45 : 30 });
	});
}

function click(name: string) {
	fireEvent.click(screen.getByRole("button", { name }));
}

// 종료를 기다리는 동안 화면을 덮는 ModalOverlay 의 바깥 틀입니다
function findCover() {
	return document.querySelector(".fixed.inset-0");
}

describe("AdminSettingsPage 관리자 종료", () => {
	test("변경이 있을 때 종료를 고르면 저장에 실패해도 다시 시도한 뒤 종료한다", async () => {
		const { onExit } = await renderPage();
		changeDraft();
		updateData.mockImplementationOnce(async () => ({ isSuccess: false, reason: "io" }));

		click("관리자 종료");
		click("프로그램 종료");
		expect(screen.getByRole("dialog").textContent).toContain("저장하지 않은 변경이 있습니다");

		click("저장하고 나가기");
		await screen.findByRole("button", { name: "다시 시도" });
		expect(quitApp).not.toHaveBeenCalled();

		click("다시 시도");
		await waitFor(() => expect(quitApp).toHaveBeenCalledTimes(1));
		expect(updateData).toHaveBeenCalledTimes(2);
		expect(onExit).not.toHaveBeenCalled();
	});

	test("변경이 있을 때 홈으로를 고르고 저장하지 않으면 초안을 되돌리고 홈으로 간다", async () => {
		const { onExit } = await renderPage();
		changeDraft();

		click("관리자 종료");
		click("홈으로");
		click("저장하지 않고 나가기");

		expect(onExit).toHaveBeenCalledTimes(1);
		expect(selectIsDirty(useSettingsDraft.getState())).toBe(false);
		expect(updateData).not.toHaveBeenCalled();
		expect(quitApp).not.toHaveBeenCalled();
	});

	test("종료에 실패하면 안내를 띄우고 다시 시도하면 다시 종료한다", async () => {
		const { onExit } = await renderPage();
		let rejectQuit: (error: Error) => void = () => {};
		quitApp.mockImplementationOnce(
			() =>
				new Promise<void>((_resolve, reject) => {
					rejectQuit = reject;
				}),
		);

		click("관리자 종료");
		click("프로그램 종료");
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(findCover()).not.toBeNull();

		await act(async () => rejectQuit(new Error("ipc")));
		expect(screen.getByRole("dialog").textContent).toContain("프로그램을 종료하지 못했습니다");

		click("다시 시도");
		await waitFor(() => expect(quitApp).toHaveBeenCalledTimes(2));
		expect(screen.queryByRole("dialog")).toBeNull();
		expect(findCover()).not.toBeNull();
		expect(onExit).not.toHaveBeenCalled();
	});

	test("종료 실패 안내를 닫으면 관리자 화면에 남는다", async () => {
		const { onExit } = await renderPage();
		quitApp.mockImplementationOnce(async () => {
			throw new Error("ipc");
		});

		click("관리자 종료");
		click("프로그램 종료");
		await screen.findByText("프로그램을 종료하지 못했습니다");

		click("닫기");
		expect(findCover()).toBeNull();
		expect(screen.getByText("공통 설정 내용")).not.toBeNull();
		expect(onExit).not.toHaveBeenCalled();
	});
});
