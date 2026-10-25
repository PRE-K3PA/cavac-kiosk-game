import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ModalOverlay from "@/components/admin/ModalOverlay";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { deleteVaccine } from "@/features/admin/vaccineList";

type VaccineDeleteOverlayProps = {
	vaccineId: string;
	onCancel: () => void;
	onDeleted: () => void;
};

export default function VaccineDeleteOverlay({
	vaccineId,
	onCancel,
	onDeleted,
}: VaccineDeleteOverlayProps) {
	const vaccineGame = useSettingsDraft((state) => state.draft["vaccine-game"]);
	const setDraft = useSettingsDraft((state) => state.setDraft);
	const vaccine = vaccineGame.vaccines.find((item) => item.id === vaccineId);

	function handleDeleteClick() {
		setDraft("vaccine-game", deleteVaccine(vaccineGame, vaccineId));
		onDeleted();
	}

	if (vaccine === undefined) return null;

	return (
		<ModalOverlay>
			<DeleteConfirmModal
				target={vaccine.productName.ko}
				onCancelClick={onCancel}
				onDeleteClick={handleDeleteClick}
			/>
		</ModalOverlay>
	);
}
