import { useState } from "react";
import AddButton from "@/components/admin/AddButton";
import AntigenRow from "@/components/admin/AntigenRow";
import EmptyState from "@/components/admin/EmptyState";
import InlineNotice from "@/components/admin/InlineNotice";
import SectionHeader from "@/components/admin/SectionHeader";
import TextInput from "@/components/admin/TextInput";
import VaccineRow from "@/components/admin/VaccineRow";
import { LIMITS } from "@/data/schema";
import { getImageUrl } from "@/data/storage";
import {
	ANTIGEN_ERROR_MESSAGES,
	type AntigenEditState,
	addAntigen,
	canFinishAntigenEdit,
	changeAntigen,
	deleteAntigen,
	finishAntigenEdit,
	getAntigenError,
	needsDeleteConfirm,
	startAntigenEdit,
	toggleExpandedVaccine,
} from "@/features/admin/antigenEditing";
import { selectAntigenEditing, useSettingsDraft } from "@/features/admin/settingsDraft";
import { useLimitNotice } from "@/features/admin/useLimitNotice";
import {
	countEnabledVaccines,
	disableVaccine,
	enableVaccine,
	filterVaccines,
	getVaccineUsageNotice,
	VACCINE_LIMIT_NOTICE,
} from "@/features/admin/vaccineList";
import AntigenDeleteOverlay from "@/pages/admin/AntigenDeleteOverlay";
import VaccineDeleteOverlay from "@/pages/admin/VaccineDeleteOverlay";
import VaccineFormOverlay from "@/pages/admin/VaccineFormOverlay";
import type { Antigen } from "@/types/data";
import { cn } from "@/utils/cn";

const SECTION_CARD_CLASS =
	"flex rounded-2xl border-2 border-border-default bg-background-surface p-5";

const SHOWN_QUERY_MAX_LENGTH = 20;

const { min: MIN_ENABLED, max: MAX_ENABLED } = LIMITS.enabledVaccines;

type DeleteTarget =
	| { type: "vaccine"; vaccineId: string }
	| { type: "antigen"; vaccineId: string; antigenId: string };

type FormTarget = { type: "add" } | { type: "edit"; vaccineId: string };

/** 검색 결과 없음 안내는 한 줄이라, 긴 검색어는 잘라서 보여 줍니다 */
function formatShownQuery(query: string) {
	const trimmed = query.trim();
	if (trimmed.length <= SHOWN_QUERY_MAX_LENGTH) return trimmed;
	return `${trimmed.slice(0, SHOWN_QUERY_MAX_LENGTH)}…`;
}

// 렌더마다 새 함수가 되면 행이 다시 그려질 때마다 스크롤되므로 모듈에 둡니다
function scrollRowIntoView(row: HTMLDivElement | null) {
	row?.scrollIntoView({ block: "nearest" });
}

export default function VaccineListSection() {
	const [query, setQuery] = useState("");
	const [expandedVaccineId, setExpandedVaccineId] = useState<string | null>(null);
	const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
	const [formTarget, setFormTarget] = useState<FormTarget | null>(null);
	// 추가한 백신 행이 목록 끝에 그려질 때 그 행까지 스크롤합니다
	const [addedVaccineId, setAddedVaccineId] = useState<string | null>(null);

	const vaccineGame = useSettingsDraft((state) => state.draft["vaccine-game"]);
	// 관리자 틀이 수정 중 탭 전환과 저장을 막도록 수정 상태는 설정 초안 스토어에 둡니다
	const currentEditing = useSettingsDraft(selectAntigenEditing);
	const setDraft = useSettingsDraft((state) => state.setDraft);
	const setAntigenEditing = useSettingsDraft((state) => state.setAntigenEditing);
	const { vaccines } = vaccineGame;
	const { isLimitNoticeShown, showLimitNotice, hideLimitNotice } = useLimitNotice();

	const editState: AntigenEditState = { data: vaccineGame, editing: currentEditing };
	const isEditing = currentEditing !== null;
	const isAntigenDoneDisabled = !canFinishAntigenEdit(editState);
	// 수정 중인 항원의 백신은 늘 펼쳐 둡니다. 패널이 다시 그려져도 수정 중인 행이 접힌 채 숨지 않게 합니다
	const shownExpandedVaccineId = currentEditing?.vaccineId ?? expandedVaccineId;
	const visibleVaccines = filterVaccines(vaccines, query);
	const editingVaccine =
		formTarget?.type === "edit"
			? vaccines.find((vaccine) => vaccine.id === formTarget.vaccineId)
			: undefined;
	const notice =
		getVaccineUsageNotice(vaccines) ?? (isLimitNoticeShown ? VACCINE_LIMIT_NOTICE : null);

	function applyAntigenEdit(next: AntigenEditState) {
		if (next.data !== vaccineGame) setDraft("vaccine-game", next.data);
		setAntigenEditing(next.editing);
	}

	function handleEnabledChange(vaccineId: string, isEnabled: boolean) {
		if (!isEnabled) {
			hideLimitNotice();
			setDraft("vaccine-game", disableVaccine(vaccineGame, vaccineId));
			return;
		}

		const result = enableVaccine(vaccineGame, vaccineId);
		if (result.isSuccess) {
			setDraft("vaccine-game", result.data);
			return;
		}
		if (result.reason === "limit") showLimitNotice();
	}

	function handleAntigenToggleClick(vaccineId: string) {
		setExpandedVaccineId(toggleExpandedVaccine(expandedVaccineId, vaccineId));
	}

	function handleAddAntigenClick(vaccineId: string) {
		applyAntigenEdit(addAntigen(editState, vaccineId));
	}

	function handleAntigenEditClick(vaccineId: string, antigenId: string) {
		applyAntigenEdit(startAntigenEdit(editState, vaccineId, antigenId));
	}

	function handleAntigenChange(nextAntigen: Omit<Antigen, "id">) {
		applyAntigenEdit(changeAntigen(editState, nextAntigen));
	}

	function handleAntigenDoneClick() {
		applyAntigenEdit(finishAntigenEdit(editState));
	}

	function handleAntigenDeleteClick(vaccineId: string, antigenId: string) {
		if (needsDeleteConfirm(currentEditing, antigenId)) {
			setDeleteTarget({ type: "antigen", vaccineId, antigenId });
			return;
		}
		applyAntigenEdit(deleteAntigen(editState, vaccineId, antigenId));
	}

	function handleAntigenDeleteConfirm(vaccineId: string, antigenId: string) {
		applyAntigenEdit(deleteAntigen(editState, vaccineId, antigenId));
		setDeleteTarget(null);
	}

	function handleVaccineDeleteOpen(vaccineId: string) {
		setDeleteTarget({ type: "vaccine", vaccineId });
	}

	function handleDeleteOverlayClose() {
		setDeleteTarget(null);
	}

	function handleAddVaccineClick() {
		setFormTarget({ type: "add" });
	}

	function handleVaccineEditClick(vaccineId: string) {
		setFormTarget({ type: "edit", vaccineId });
	}

	function handleFormClose() {
		setFormTarget(null);
	}

	function handleVaccineAdded(vaccineId: string) {
		setFormTarget(null);
		// 새 백신은 항원이 없어 저장이 막히므로, 검색을 풀고 펼쳐서 "+ 항원 추가" 가 바로 보이게 합니다
		setQuery("");
		setExpandedVaccineId(vaccineId);
		setAddedVaccineId(vaccineId);
	}

	function handleQueryChange(nextQuery: string) {
		setQuery(nextQuery);
		// 검색으로 빠졌던 새 백신 행이 다시 그려질 때 또 스크롤하지 않게 합니다
		setAddedVaccineId(null);
	}

	function getAntigenErrorMessage(vaccineId: string, antigenId: string) {
		const error = getAntigenError(vaccineGame, vaccineId, antigenId);
		// 항원 추가로 생긴 행은 입력 전부터 빨간 문구를 띄우지 않습니다. 완료는 그대로 막힙니다
		if (error === null || (error === "empty" && currentEditing?.isNew)) return undefined;
		return ANTIGEN_ERROR_MESSAGES[error];
	}

	function renderAntigenRow(vaccineId: string, antigen: Antigen) {
		const isEditingRow =
			currentEditing?.vaccineId === vaccineId && currentEditing.antigenId === antigen.id;

		return (
			<AntigenRow
				key={antigen.id}
				value={antigen}
				isEditing={isEditingRow}
				abbrErrorMessage={isEditingRow ? getAntigenErrorMessage(vaccineId, antigen.id) : undefined}
				isDoneDisabled={isAntigenDoneDisabled}
				isEditDeleteDisabled={isEditing && !isEditingRow}
				onChange={handleAntigenChange}
				onEditClick={() => handleAntigenEditClick(vaccineId, antigen.id)}
				onDoneClick={handleAntigenDoneClick}
				onDeleteClick={() => handleAntigenDeleteClick(vaccineId, antigen.id)}
			/>
		);
	}

	function renderList() {
		if (vaccines.length === 0) {
			return (
				<EmptyState
					title="등록된 백신이 없습니다"
					description="'+ 새 백신 추가'를 눌러 백신을 등록해 주세요."
				/>
			);
		}
		if (visibleVaccines.length === 0) {
			return (
				<EmptyState
					title="검색 결과가 없습니다"
					description={`'${formatShownQuery(query)}'에 맞는 백신이 없습니다.`}
					className="h-70 shrink-0"
				/>
			);
		}

		return visibleVaccines.map((vaccine) => {
			const isExpanded = vaccine.id === shownExpandedVaccineId;

			return (
				<VaccineRow
					key={vaccine.id}
					ref={vaccine.id === addedVaccineId ? scrollRowIntoView : undefined}
					productName={vaccine.productName}
					imageSrc={getImageUrl(vaccine.bottleImage.ko)}
					antigenCount={vaccine.antigens.length}
					isEnabled={vaccine.isEnabled}
					disabled={isEditing}
					isExpanded={isExpanded}
					onEnabledChange={(isEnabled) => handleEnabledChange(vaccine.id, isEnabled)}
					onAntigenToggleClick={() => handleAntigenToggleClick(vaccine.id)}
					onEditClick={() => handleVaccineEditClick(vaccine.id)}
					onDeleteClick={() => handleVaccineDeleteOpen(vaccine.id)}
					onAddAntigenClick={() => handleAddAntigenClick(vaccine.id)}
					className="w-full shrink-0">
					{isExpanded && vaccine.antigens.map((antigen) => renderAntigenRow(vaccine.id, antigen))}
				</VaccineRow>
			);
		});
	}

	return (
		<section className={cn(SECTION_CARD_CLASS, "min-h-0 min-w-0 flex-1 flex-col gap-3")}>
			<SectionHeader
				tone="vaccine"
				title="백신 관리"
				description={`게임에 쓸 백신을 ${MIN_ENABLED}~${MAX_ENABLED}개 체크하세요. "항원 N개"를 누르면 항원을 고칠 수 있어요.`}
			/>
			<TextInput
				value={query}
				placeholder="백신 검색"
				aria-label="백신 검색"
				isSearchIconVisible
				disabled={isEditing}
				onChange={handleQueryChange}
				className="w-full shrink-0"
			/>
			{/* 안내 줄이 나타나고 사라질 때 목록이 움직이지 않게 줄 높이를 안내 줄(44)에 맞춰 둡니다 */}
			<div className="flex h-11 shrink-0 items-center gap-4">
				<p className="typo-admin-label whitespace-nowrap text-text-primary">
					사용 {countEnabledVaccines(vaccines)} / {MAX_ENABLED}
				</p>
				{notice && <InlineNotice tone={notice.tone} message={notice.message} />}
			</div>
			<div
				className={cn(
					"flex min-h-0 flex-1 flex-col gap-2",
					"overflow-y-auto overscroll-contain [scrollbar-width:none]",
				)}>
				{renderList()}
			</div>
			<AddButton
				label="새 백신 추가"
				disabled={isEditing}
				onClick={handleAddVaccineClick}
				className="w-full shrink-0"
			/>

			{(formTarget?.type === "add" || editingVaccine) && (
				<VaccineFormOverlay
					vaccine={editingVaccine}
					onCancel={handleFormClose}
					onDone={handleFormClose}
					onAdded={handleVaccineAdded}
				/>
			)}
			{deleteTarget?.type === "vaccine" && (
				<VaccineDeleteOverlay
					vaccineId={deleteTarget.vaccineId}
					onCancel={handleDeleteOverlayClose}
					onDeleted={handleDeleteOverlayClose}
				/>
			)}
			{deleteTarget?.type === "antigen" && (
				<AntigenDeleteOverlay
					vaccineId={deleteTarget.vaccineId}
					antigenId={deleteTarget.antigenId}
					onCancel={handleDeleteOverlayClose}
					onDeleteClick={() =>
						handleAntigenDeleteConfirm(deleteTarget.vaccineId, deleteTarget.antigenId)
					}
				/>
			)}
		</section>
	);
}
