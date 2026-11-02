import { useState } from "react";
import PINPanel from "@/components/admin/PINPanel";
import { verifyPin } from "@/data/storage";
import { appendPinDigit, deletePinDigit, isPinComplete } from "@/features/admin/pinForm";

type AdminPinPageProps = {
	onSuccess: () => void;
	onCancel: () => void;
};

async function checkPin(pin: string) {
	try {
		return await verifyPin(pin);
	} catch {
		return false;
	}
}

export default function AdminPinPage({ onSuccess, onCancel }: AdminPinPageProps) {
	const [pin, setPin] = useState("");
	const [isError, setIsError] = useState(false);
	const [isChecking, setIsChecking] = useState(false);

	function handleDigitClick(digit: string) {
		if (isChecking) return;
		setIsError(false);
		setPin((current) => appendPinDigit(current, digit));
	}

	function handleDeleteClick() {
		if (isChecking) return;
		setIsError(false);
		setPin(deletePinDigit);
	}

	async function handleConfirmClick() {
		if (isChecking) return;

		setIsChecking(true);
		const isCorrect = isPinComplete(pin) && (await checkPin(pin));
		setIsChecking(false);

		if (isCorrect) {
			onSuccess();
			return;
		}
		setPin("");
		setIsError(true);
	}

	function handleCancelClick() {
		if (isChecking) return;
		onCancel();
	}

	return (
		<div className="flex h-full w-full items-center justify-center bg-background-surface-subtle">
			<PINPanel
				pinLength={pin.length}
				isError={isError}
				onDigitClick={handleDigitClick}
				onDeleteClick={handleDeleteClick}
				onConfirmClick={handleConfirmClick}
				onCancelClick={handleCancelClick}
			/>
		</div>
	);
}
