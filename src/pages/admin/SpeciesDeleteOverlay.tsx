import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import ModalOverlay from "@/components/admin/ModalOverlay";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { deleteSpecies, isSpeciesOnHome, SPECIES_HOME_WARNING } from "@/features/admin/speciesForm";
import type { Species } from "@/types/data";

type SpeciesDeleteOverlayProps = {
	species: Species;
	onCancel: () => void;
	onDeleted: () => void;
};

export default function SpeciesDeleteOverlay({
	species,
	onCancel,
	onDeleted,
}: SpeciesDeleteOverlayProps) {
	const common = useSettingsDraft((state) => state.draft.common);
	const setDraft = useSettingsDraft((state) => state.setDraft);

	function handleDeleteClick() {
		setDraft("common", deleteSpecies(common, species.id));
		onDeleted();
	}

	return (
		<ModalOverlay>
			<DeleteConfirmModal
				target={species.name}
				warningMessage={
					isSpeciesOnHome(common.homeAnimals, species.id) ? SPECIES_HOME_WARNING : undefined
				}
				onCancelClick={onCancel}
				onDeleteClick={handleDeleteClick}
			/>
		</ModalOverlay>
	);
}
