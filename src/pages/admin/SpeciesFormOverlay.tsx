import { useState } from "react";
import ImagePreviewModal from "@/components/admin/ImagePreviewModal";
import ModalOverlay from "@/components/admin/ModalOverlay";
import SpeciesModal from "@/components/admin/SpeciesModal";
import { getImageUrl } from "@/data/storage";
import { IMAGE_ERROR_MESSAGES, selectImage } from "@/features/admin/imageUpload";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import {
	addSpecies,
	SPECIES_FORM_MESSAGES,
	updateSpecies,
	validateSpeciesName,
} from "@/features/admin/speciesForm";
import SpeciesDeleteOverlay from "@/pages/admin/SpeciesDeleteOverlay";
import type { ImagePath, Species } from "@/types/data";

type SpeciesFormOverlayProps = {
	species?: Species;
	onCancel: () => void;
	onDone: () => void;
};

export default function SpeciesFormOverlay({ species, onCancel, onDone }: SpeciesFormOverlayProps) {
	const [name, setName] = useState(species?.name ?? "");
	const [character, setCharacter] = useState<ImagePath | undefined>(species?.character);
	const [nameError, setNameError] = useState<string>();
	const [imageError, setImageError] = useState<string>();
	const [isSelectingImage, setIsSelectingImage] = useState(false);
	const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
	const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);

	const common = useSettingsDraft((state) => state.draft.common);
	const setDraft = useSettingsDraft((state) => state.setDraft);

	const imageSrc = character && getImageUrl(character);

	function handleNameChange(edited: string) {
		setName(edited);
		setNameError(undefined);
	}

	async function handleImageSelectClick() {
		if (isSelectingImage) return;
		setIsSelectingImage(true);
		const result = await selectImage("species");
		setIsSelectingImage(false);

		if (result.status === "cancel") return;
		if (result.status === "error") {
			setImageError(IMAGE_ERROR_MESSAGES[result.reason]);
			return;
		}
		setCharacter(result.path);
		setImageError(undefined);
	}

	function handleConfirmClick() {
		// Figma _NameEmpty·_NameDuplicate 처럼 이름 오류를 먼저 하나만 보여 줍니다
		const nameErrorMessage = validateSpeciesName(name, common.species, species?.id);
		if (nameErrorMessage) {
			setNameError(nameErrorMessage);
			return;
		}
		if (!character) {
			setImageError(SPECIES_FORM_MESSAGES.imageEmpty);
			return;
		}

		const saved = { id: species?.id ?? crypto.randomUUID(), name: name.trim(), character };
		setDraft("common", species ? updateSpecies(common, saved) : addSpecies(common, saved));
		onDone();
	}

	function handleCancelClick() {
		if (isSelectingImage) return;
		onCancel();
	}

	function handleDeleteClick() {
		if (isSelectingImage) return;
		setIsDeleteConfirmOpen(true);
	}

	function handleDeleteCancel() {
		setIsDeleteConfirmOpen(false);
	}

	function handleImagePreviewClick() {
		if (isSelectingImage) return;
		setIsImageZoomOpen(true);
	}

	function handleImageZoomClose() {
		setIsImageZoomOpen(false);
	}

	const modeProps = species
		? { mode: "edit" as const, originalName: species.name, onDeleteClick: handleDeleteClick }
		: { mode: "add" as const };

	return (
		<>
			<ModalOverlay>
				<SpeciesModal
					{...modeProps}
					name={name}
					imageSrc={imageSrc}
					nameErrorMessage={nameError}
					imageErrorMessage={imageError}
					isConfirmDisabled={isSelectingImage}
					onNameChange={handleNameChange}
					onImageSelectClick={handleImageSelectClick}
					onImagePreviewClick={handleImagePreviewClick}
					onCancelClick={handleCancelClick}
					onConfirmClick={handleConfirmClick}
				/>
			</ModalOverlay>
			{isImageZoomOpen && imageSrc && (
				<ModalOverlay>
					<ImagePreviewModal
						tone="common"
						description="캐릭터 이미지"
						items={[
							{
								caption: name.trim() || "캐릭터",
								content: (
									<img src={imageSrc} alt="" className="aspect-square w-full object-contain" />
								),
							},
						]}
						onCloseClick={handleImageZoomClose}
					/>
				</ModalOverlay>
			)}
			{isDeleteConfirmOpen && species && (
				<SpeciesDeleteOverlay species={species} onCancel={handleDeleteCancel} onDeleted={onDone} />
			)}
		</>
	);
}
