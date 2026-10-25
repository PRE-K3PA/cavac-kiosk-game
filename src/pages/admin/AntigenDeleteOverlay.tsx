import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ModalOverlay from "@/components/admin/ModalOverlay";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import type { Antigen } from "@/types/data";

type AntigenDeleteOverlayProps = {
	vaccineId: string;
	antigenId: string;
	onCancel: () => void;
	/** 초안과 수정 상태를 함께 바꾸는 일(applyAntigenEdit)을 한곳에 두려고 삭제는 화면이 맡습니다 */
	onDeleteClick: () => void;
};

/** Figma AntigenDeleteOverlay 처럼 약어와 세부 타입을 가운뎃점으로 잇습니다. 약어가 비면 행 이름과 같게 씁니다 */
function formatDeleteTarget({ abbr, subtype }: Antigen) {
	const trimmedAbbr = abbr.trim();
	if (trimmedAbbr === "") return "새 항원";

	const trimmedSubtype = subtype?.trim();
	return trimmedSubtype ? `${trimmedAbbr} · ${trimmedSubtype}` : trimmedAbbr;
}

export default function AntigenDeleteOverlay({
	vaccineId,
	antigenId,
	onCancel,
	onDeleteClick,
}: AntigenDeleteOverlayProps) {
	const antigen = useSettingsDraft((state) =>
		state.draft["vaccine-game"].vaccines
			.find((vaccine) => vaccine.id === vaccineId)
			?.antigens.find((item) => item.id === antigenId),
	);

	if (antigen === undefined) return null;

	return (
		<ModalOverlay>
			<DeleteConfirmModal
				target={formatDeleteTarget(antigen)}
				onCancelClick={onCancel}
				onDeleteClick={onDeleteClick}
			/>
		</ModalOverlay>
	);
}
