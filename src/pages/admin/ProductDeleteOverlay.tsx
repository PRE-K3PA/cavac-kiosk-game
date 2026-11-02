import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ModalOverlay from "@/components/admin/ModalOverlay";
import { deleteProduct } from "@/features/admin/productSlots";
import { useSettingsDraft } from "@/features/admin/settingsDraft";

type ProductDeleteOverlayProps = {
	slot: number;
	onCancel: () => void;
	onDeleted: () => void;
};

export default function ProductDeleteOverlay({
	slot,
	onCancel,
	onDeleted,
}: ProductDeleteOverlayProps) {
	const card = useSettingsDraft((state) => state.draft["card-game"]);
	const setDraft = useSettingsDraft((state) => state.setDraft);

	function handleDeleteClick() {
		setDraft("card-game", deleteProduct(card, slot));
		onDeleted();
	}

	return (
		<ModalOverlay>
			<DeleteConfirmModal
				target={`${slot}번 칸`}
				onCancelClick={onCancel}
				onDeleteClick={handleDeleteClick}
			/>
		</ModalOverlay>
	);
}
