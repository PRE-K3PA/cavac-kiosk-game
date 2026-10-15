import { type ReactNode, useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import type { AdminTone } from "@/components/admin/adminToneLabel";
import ConfirmModal from "@/components/admin/ConfirmModal";
import ModalOverlay from "@/components/admin/ModalOverlay";
import SaveBar from "@/components/admin/SaveBar";
import SavedModal from "@/components/admin/SavedModal";
import SaveFailedModal from "@/components/admin/SaveFailedModal";
import SettingsTab from "@/components/admin/SettingsTab";
import {
	selectIsDirty,
	selectSaveIssueCount,
	useSettingsDraft,
} from "@/features/admin/settingsDraft";
import { cn } from "@/utils/cn";

const TONES = ["common", "vaccine", "card"] as const satisfies readonly AdminTone[];

type Overlay = "saved" | "saveFailed" | "saveAndExitFailed" | "exitConfirm" | "discardConfirm";

type AdminSettingsPageProps = {
	/** 탭마다 보여 줄 설정 영역. 10 공통, 11 백신, 12 카드 화면이 들어옵니다 */
	contents: Record<AdminTone, ReactNode>;
	onExit: () => void;
};

export default function AdminSettingsPage({ contents, onExit }: AdminSettingsPageProps) {
	const [activeTone, setActiveTone] = useState<AdminTone>("common");
	const [overlay, setOverlay] = useState<Overlay | null>(null);

	const isLoaded = useSettingsDraft((state) => state.isLoaded);
	const isSaving = useSettingsDraft((state) => state.isSaving);
	const isDirty = useSettingsDraft(selectIsDirty);
	const issueCount = useSettingsDraft(selectSaveIssueCount);
	const load = useSettingsDraft((state) => state.load);
	const save = useSettingsDraft((state) => state.save);
	const revert = useSettingsDraft((state) => state.revert);

	useEffect(() => {
		void load();
	}, [load]);

	// 저장 규칙에 걸리면 저장하지 않고 SaveBar 의 요약으로 이유를 보여 줍니다
	const hasIssues = issueCount > 0;

	const summary = hasIssues ? `저장할 수 없습니다 · ${issueCount}곳을 확인해 주세요` : undefined;

	async function handleSaveClick() {
		setOverlay(null);
		if (hasIssues) return;
		setOverlay((await save()) ? "saved" : "saveFailed");
	}

	async function handleSaveAndLeaveClick() {
		setOverlay(null);
		if (hasIssues) return;
		if (await save()) {
			onExit();
			return;
		}
		setOverlay("saveAndExitFailed");
	}

	function handleExitClick() {
		if (isSaving) return;
		if (isDirty) {
			setOverlay("exitConfirm");
			return;
		}
		onExit();
	}

	function handleLeaveClick() {
		revert();
		onExit();
	}

	function handleRevertClick() {
		revert();
		setOverlay(null);
	}

	function handleOverlayClose() {
		setOverlay(null);
	}

	return (
		<div className="flex h-full w-full flex-col bg-background-surface-subtle">
			<AdminHeader
				tone={activeTone}
				isUnsaved={isDirty}
				onExitClick={handleExitClick}
				className="portrait:h-35 portrait:gap-4 portrait:px-8"
			/>
			<div className="flex min-h-0 flex-1 portrait:flex-col">
				<nav
					className={cn(
						"flex w-80 shrink-0 flex-col gap-4 border-r-2 border-border-default px-4 py-8",
						"portrait:h-30 portrait:w-full portrait:flex-row portrait:items-center",
						"portrait:border-r-0 portrait:border-b-2 portrait:px-8 portrait:py-0",
					)}>
					{TONES.map((tone) => (
						<SettingsTab
							key={tone}
							tone={tone}
							isActive={tone === activeTone}
							onClick={() => setActiveTone(tone)}
							className="portrait:h-22 portrait:w-80"
						/>
					))}
				</nav>
				<main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-5 portrait:px-12 portrait:py-8">
					{isLoaded && contents[activeTone]}
				</main>
			</div>
			<SaveBar
				summary={summary}
				isCancelDisabled={!isDirty || isSaving}
				isSaveDisabled={!isDirty || isSaving}
				onCancelClick={() => setOverlay("discardConfirm")}
				onSaveClick={handleSaveClick}
				className="portrait:h-35"
			/>

			{overlay && (
				<ModalOverlay>
					{overlay === "saved" && <SavedModal onConfirmClick={handleOverlayClose} />}
					{overlay === "saveFailed" && (
						<SaveFailedModal onCloseClick={handleOverlayClose} onRetryClick={handleSaveClick} />
					)}
					{overlay === "saveAndExitFailed" && (
						<SaveFailedModal
							onCloseClick={handleOverlayClose}
							onRetryClick={handleSaveAndLeaveClick}
						/>
					)}
					{overlay === "exitConfirm" && (
						<ConfirmModal
							type="exit"
							tone={activeTone}
							onCancelClick={handleOverlayClose}
							onLeaveClick={handleLeaveClick}
							onSaveAndLeaveClick={handleSaveAndLeaveClick}
						/>
					)}
					{overlay === "discardConfirm" && (
						<ConfirmModal
							type="discard"
							tone={activeTone}
							onCancelClick={handleOverlayClose}
							onRevertClick={handleRevertClick}
						/>
					)}
				</ModalOverlay>
			)}
		</div>
	);
}
