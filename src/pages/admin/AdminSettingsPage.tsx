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
	selectIsAntigenEditing,
	selectIsDirty,
	selectSaveIssueCount,
	useSettingsDraft,
} from "@/features/admin/settingsDraft";
import { useOrientation } from "@/layout/OrientationContext";
import { cn } from "@/utils/cn";

const TONES = ["common", "vaccine", "card"] as const satisfies readonly AdminTone[];

const LAYOUT = {
	landscape: {
		header: "",
		body: "",
		nav: "w-80 flex-col border-r-2 px-4 py-8",
		tab: "",
		main: "p-5",
		saveBar: "",
	},
	portrait: {
		header: "h-35 gap-4 px-8",
		body: "flex-col",
		nav: "h-30 w-full flex-row items-center border-b-2 px-8",
		tab: "h-22 w-80",
		main: "px-12 py-8",
		saveBar: "h-35",
	},
} as const;

// Figma _AntigenEditingSave 의 저장 막대 문구
const ANTIGEN_EDITING_SUMMARY = "항원 수정 중입니다 · '완료'를 누른 뒤 저장해 주세요";

// 항원 수정 중에 막힌 탭. SettingsTab 에 비활성 모양이 없어 여기서 흐리게 합니다
const LOCKED_TAB_CLASS =
	"disabled:border-border-muted disabled:bg-background-muted disabled:text-text-placeholder";

type Overlay = "saved" | "saveFailed" | "saveAndExitFailed" | "exitConfirm" | "discardConfirm";

function getSaveSummary(isAntigenEditing: boolean, issueCount: number): string | undefined {
	if (isAntigenEditing) return ANTIGEN_EDITING_SUMMARY;
	if (issueCount > 0) return `저장할 수 없습니다 · ${issueCount}곳을 확인해 주세요`;
	return undefined;
}

type AdminSettingsPageProps = {
	/** 탭마다 보여 줄 설정 영역. 10 공통, 11 백신, 12 카드 화면이 들어옵니다 */
	contents: Record<AdminTone, ReactNode>;
	onExit: () => void;
};

export default function AdminSettingsPage({ contents, onExit }: AdminSettingsPageProps) {
	const [activeTone, setActiveTone] = useState<AdminTone>("common");
	const [overlay, setOverlay] = useState<Overlay | null>(null);
	const layout = LAYOUT[useOrientation()];

	const isLoaded = useSettingsDraft((state) => state.isLoaded);
	const isSaving = useSettingsDraft((state) => state.isSaving);
	const isDirty = useSettingsDraft(selectIsDirty);
	const issueCount = useSettingsDraft(selectSaveIssueCount);
	const isAntigenEditing = useSettingsDraft(selectIsAntigenEditing);
	const load = useSettingsDraft((state) => state.load);
	const save = useSettingsDraft((state) => state.save);
	const revert = useSettingsDraft((state) => state.revert);

	useEffect(() => {
		void load();
	}, [load]);

	// 저장 규칙에 걸리거나 항원을 수정하는 중이면 저장하지 않고 SaveBar 의 요약으로 이유를 보여 줍니다
	const isSaveBlocked = issueCount > 0 || isAntigenEditing;

	const summary = getSaveSummary(isAntigenEditing, issueCount);

	async function handleSaveClick() {
		setOverlay(null);
		if (isSaveBlocked) return;
		setOverlay((await save()) ? "saved" : "saveFailed");
	}

	async function handleSaveAndLeaveClick() {
		setOverlay(null);
		if (isSaveBlocked) return;
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

	function handleCancelClick() {
		setOverlay("discardConfirm");
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
				className={layout.header}
			/>
			<div className={cn("flex min-h-0 flex-1", layout.body)}>
				<nav className={cn("flex shrink-0 gap-4 border-border-default", layout.nav)}>
					{TONES.map((tone) => (
						<SettingsTab
							key={tone}
							tone={tone}
							isActive={tone === activeTone}
							// 항원 수정은 완료·삭제로만 빠져나오므로(#74) 수정 중에는 다른 탭으로도 못 갑니다
							disabled={isAntigenEditing && tone !== activeTone}
							onClick={() => setActiveTone(tone)}
							className={cn(layout.tab, LOCKED_TAB_CLASS)}
						/>
					))}
				</nav>
				<main className={cn("min-h-0 min-w-0 flex-1 overflow-y-auto", layout.main)}>
					{isLoaded && contents[activeTone]}
				</main>
			</div>
			<SaveBar
				summary={summary}
				isCancelDisabled={!isDirty || isSaving}
				isSaveDisabled={!isDirty || isSaving}
				onCancelClick={handleCancelClick}
				onSaveClick={handleSaveClick}
				className={layout.saveBar}
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
							isSaveAndLeaveDisabled={isSaveBlocked}
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
