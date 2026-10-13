import { useId } from "react";
import Button from "@/components/admin/Button";
import FieldMessage from "@/components/admin/FieldMessage";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import TextInput from "@/components/admin/TextInput";
import { cn } from "@/utils/cn";

const PIN_LENGTH = 4;

const PIN_FIELDS = [
	{ key: "current", label: "현재 PIN *" },
	{ key: "next", label: "새 PIN *" },
	{ key: "confirm", label: "새 PIN 확인 *" },
] as const;

type PinField = (typeof PIN_FIELDS)[number];
type PinFieldKey = PinField["key"];
type PinChangeValue = Record<PinFieldKey, string>;

type PINChangeModalProps = {
	value: PinChangeValue;
	errorMessages?: Partial<Record<PinFieldKey, string>>;
	isSaveDisabled?: boolean;
	onChange?: (value: PinChangeValue) => void;
	onCancelClick?: () => void;
	onSaveClick?: () => void;
	className?: string;
};

export default function PINChangeModal({
	value,
	errorMessages = {},
	isSaveDisabled,
	onChange,
	onCancelClick,
	onSaveClick,
	className,
}: PINChangeModalProps) {
	const fieldIdPrefix = useId();

	function renderField({ key, label }: PinField) {
		const inputId = `${fieldIdPrefix}-${key}`;
		const messageId = `${inputId}-message`;
		const errorMessage = errorMessages[key];

		function handleChange(text: string) {
			onChange?.({ ...value, [key]: text.replace(/\D/g, "") });
		}

		return (
			<div key={key} className="flex w-full flex-col gap-2">
				<label htmlFor={inputId} className="typo-admin-body text-text-primary">
					{label}
				</label>
				<TextInput
					id={inputId}
					type="password"
					inputMode="numeric"
					maxLength={PIN_LENGTH}
					value={value[key]}
					isError={Boolean(errorMessage)}
					aria-describedby={errorMessage ? messageId : undefined}
					onChange={handleChange}
					className="w-full"
				/>
				{errorMessage && <FieldMessage id={messageId} message={errorMessage} />}
			</div>
		);
	}

	return (
		<ModalFrame className={cn("w-160", className)}>
			<ModalHeader title="관리자 PIN 변경" subtitle="4자리 숫자 PIN을 입력해 주세요." />
			{PIN_FIELDS.map(renderField)}
			<p className="typo-admin-caption text-text-secondary">저장하면 바로 바뀝니다.</p>
			<div className="flex w-full justify-end gap-3">
				<Button variant="secondary" label="취소" onClick={onCancelClick} />
				<Button label="저장" disabled={isSaveDisabled} onClick={onSaveClick} />
			</div>
		</ModalFrame>
	);
}
