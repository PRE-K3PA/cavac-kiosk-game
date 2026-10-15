import { useState } from "react";
import ModalOverlay from "@/components/admin/ModalOverlay";
import PINChangeModal from "@/components/admin/PINChangeModal";
import SaveFailedModal from "@/components/admin/SaveFailedModal";
import { updatePin } from "@/data/storage";
import {
	clearEditedFieldErrors,
	EMPTY_PIN_CHANGE_FORM,
	hasPinChangeErrors,
	PIN_CHANGE_MESSAGES,
	type PinChangeErrors,
	type PinChangeForm,
	validatePinChange,
} from "@/features/admin/pinForm";
import type { PinChangeResult } from "@/types/data";

type PinChangeOverlayProps = {
	onCancel: () => void;
	onChanged: () => void;
};

async function savePin(current: string, next: string): Promise<PinChangeResult> {
	try {
		return await updatePin(current, next);
	} catch {
		return { isSuccess: false, reason: "io" };
	}
}

export default function PinChangeOverlay({ onCancel, onChanged }: PinChangeOverlayProps) {
	const [form, setForm] = useState<PinChangeForm>(EMPTY_PIN_CHANGE_FORM);
	const [errors, setErrors] = useState<PinChangeErrors>({});
	const [isSaving, setIsSaving] = useState(false);
	const [isSaveFailed, setIsSaveFailed] = useState(false);

	function handleFormChange(edited: PinChangeForm) {
		setErrors(clearEditedFieldErrors(errors, form, edited));
		setForm(edited);
	}

	async function handleSaveClick() {
		const validationErrors = validatePinChange(form);
		setErrors(validationErrors);
		if (hasPinChangeErrors(validationErrors)) return;

		setIsSaving(true);
		const result = await savePin(form.current, form.next);
		setIsSaving(false);

		if (result.isSuccess) {
			onChanged();
			return;
		}
		if (result.reason === "wrong-current") {
			setErrors({ current: PIN_CHANGE_MESSAGES.wrongCurrent });
			return;
		}
		setIsSaveFailed(true);
	}

	function handleCancelClick() {
		if (isSaving) return;
		onCancel();
	}

	function handleSaveFailedClose() {
		setIsSaveFailed(false);
	}

	function handleRetryClick() {
		setIsSaveFailed(false);
		void handleSaveClick();
	}

	return (
		<ModalOverlay>
			{isSaveFailed ? (
				<SaveFailedModal onCloseClick={handleSaveFailedClose} onRetryClick={handleRetryClick} />
			) : (
				<PINChangeModal
					value={form}
					errorMessages={errors}
					isSaveDisabled={isSaving}
					onChange={handleFormChange}
					onCancelClick={handleCancelClick}
					onSaveClick={handleSaveClick}
				/>
			)}
		</ModalOverlay>
	);
}
