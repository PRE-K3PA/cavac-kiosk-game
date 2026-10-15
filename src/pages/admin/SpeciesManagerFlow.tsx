import { useState } from "react";
import ModalOverlay from "@/components/admin/ModalOverlay";
import SpeciesManagerModal from "@/components/admin/SpeciesManagerModal";
import { getImageUrl } from "@/data/storage";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { useOrientation } from "@/layout/OrientationContext";
import SpeciesDeleteOverlay from "@/pages/admin/SpeciesDeleteOverlay";
import SpeciesFormOverlay from "@/pages/admin/SpeciesFormOverlay";

type Overlay =
	| { type: "manager" }
	| { type: "add" }
	| { type: "edit"; speciesId: string }
	| { type: "delete"; speciesId: string };

const MANAGER: Overlay = { type: "manager" };

type SpeciesManagerFlowProps = {
	onClose: () => void;
};

export default function SpeciesManagerFlow({ onClose }: SpeciesManagerFlowProps) {
	const [overlay, setOverlay] = useState<Overlay>(MANAGER);
	const orientation = useOrientation();
	const species = useSettingsDraft((state) => state.draft.common.species);

	const managerItems = species.map((item) => ({
		id: item.id,
		name: item.name,
		imageSrc: getImageUrl(item.character),
	}));
	const targetSpecies =
		"speciesId" in overlay ? species.find((item) => item.id === overlay.speciesId) : undefined;

	function handleAddClick() {
		setOverlay({ type: "add" });
	}

	function handleEditClick(speciesId: string) {
		setOverlay({ type: "edit", speciesId });
	}

	function handleDeleteClick(speciesId: string) {
		setOverlay({ type: "delete", speciesId });
	}

	function handleManagerReturn() {
		setOverlay(MANAGER);
	}

	if (overlay.type === "add") {
		return <SpeciesFormOverlay onCancel={handleManagerReturn} onDone={handleManagerReturn} />;
	}
	if (overlay.type === "edit" && targetSpecies) {
		return (
			<SpeciesFormOverlay
				species={targetSpecies}
				onCancel={handleManagerReturn}
				onDone={handleManagerReturn}
			/>
		);
	}
	if (overlay.type === "delete" && targetSpecies) {
		return (
			<SpeciesDeleteOverlay
				species={targetSpecies}
				onCancel={handleManagerReturn}
				onDeleted={handleManagerReturn}
			/>
		);
	}

	return (
		<ModalOverlay>
			<SpeciesManagerModal
				orientation={orientation}
				species={managerItems}
				onAddClick={handleAddClick}
				onEditClick={handleEditClick}
				onDeleteClick={handleDeleteClick}
				onCloseClick={onClose}
			/>
		</ModalOverlay>
	);
}
