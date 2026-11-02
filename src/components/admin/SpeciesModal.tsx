import { useId } from "react";
import Button from "@/components/admin/Button";
import FieldMessage from "@/components/admin/FieldMessage";
import ImageField from "@/components/admin/ImageField";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import TextInput from "@/components/admin/TextInput";
import { LIMITS } from "@/data/schema";
import { cn } from "@/utils/cn";

type AddModeProps = {
	mode: "add";
};

type EditModeProps = {
	mode: "edit";
	originalName: string;
	onDeleteClick?: () => void;
};

type SpeciesModalProps = (AddModeProps | EditModeProps) & {
	name: string;
	imageSrc?: string;
	nameErrorMessage?: string;
	imageErrorMessage?: string;
	isConfirmDisabled?: boolean;
	onNameChange?: (name: string) => void;
	onImageSelectClick?: () => void;
	onImagePreviewClick?: () => void;
	onCancelClick?: () => void;
	onConfirmClick?: () => void;
	className?: string;
};

export default function SpeciesModal(props: SpeciesModalProps) {
	const {
		name,
		imageSrc,
		nameErrorMessage,
		imageErrorMessage,
		isConfirmDisabled,
		onNameChange,
		onImageSelectClick,
		onImagePreviewClick,
		onCancelClick,
		onConfirmClick,
		className,
	} = props;
	const nameInputId = useId();
	const nameMessageId = useId();
	const header =
		props.mode === "edit"
			? { title: "축종 수정", subtitle: props.originalName }
			: { title: "축종 추가", subtitle: "이름과 캐릭터 이미지를 넣어 주세요." };

	return (
		<ModalFrame className={cn("w-160", className)}>
			<ModalHeader title={header.title} subtitle={header.subtitle} />
			<div className="flex w-full flex-col gap-2">
				<label htmlFor={nameInputId} className="typo-admin-body text-text-primary">
					축종명 *
				</label>
				<TextInput
					id={nameInputId}
					value={name}
					placeholder="예: 돼지"
					maxLength={LIMITS.speciesName.max}
					isError={Boolean(nameErrorMessage)}
					aria-describedby={nameErrorMessage ? nameMessageId : undefined}
					onChange={onNameChange}
					className="w-full"
				/>
				{nameErrorMessage && <FieldMessage id={nameMessageId} message={nameErrorMessage} />}
			</div>
			<div className="flex flex-col gap-2">
				<p className="typo-admin-body text-text-primary">캐릭터 이미지 *</p>
				<ImageField
					shape="square"
					imageSrc={imageSrc}
					errorMessage={imageErrorMessage}
					onSelectClick={onImageSelectClick}
					onPreviewClick={onImagePreviewClick}
				/>
			</div>
			<div className="flex w-full gap-3">
				{props.mode === "edit" && (
					<Button variant="danger" label="삭제" onClick={props.onDeleteClick} />
				)}
				<Button variant="secondary" label="취소" className="ml-auto" onClick={onCancelClick} />
				<Button label="확인" disabled={isConfirmDisabled} onClick={onConfirmClick} />
			</div>
		</ModalFrame>
	);
}
