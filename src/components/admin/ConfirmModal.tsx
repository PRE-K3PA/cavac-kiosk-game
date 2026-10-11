import type { AdminTone } from "@/components/admin/adminToneLabel";
import Button from "@/components/admin/Button";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import { cn } from "@/utils/cn";

type ExitConfirmProps = {
	type: "exit";
	onLeaveClick?: () => void;
	onSaveAndLeaveClick?: () => void;
};

type DiscardConfirmProps = {
	type: "discard";
	onRevertClick?: () => void;
};

type ConfirmModalProps = (ExitConfirmProps | DiscardConfirmProps) & {
	tone?: AdminTone;
	onCancelClick?: () => void;
	className?: string;
};

export default function ConfirmModal(props: ConfirmModalProps) {
	const { tone = "common", onCancelClick, className } = props;

	if (props.type === "exit") {
		return (
			<ModalFrame className={cn("w-200", className)}>
				<ModalHeader
					tone={tone}
					title="저장하지 않은 변경이 있습니다"
					subtitle="저장하지 않고 나가면 변경한 내용이 사라집니다."
				/>
				<div className="flex w-full items-center gap-3">
					<Button variant="secondary" label="취소" onClick={onCancelClick} />
					<Button
						variant="danger"
						label="저장하지 않고 나가기"
						className="ml-auto w-75"
						onClick={props.onLeaveClick}
					/>
					<Button
						variant="primary"
						label="저장하고 나가기"
						className="w-60"
						onClick={props.onSaveAndLeaveClick}
					/>
				</div>
			</ModalFrame>
		);
	}

	return (
		<ModalFrame className={cn("w-200", className)}>
			<ModalHeader
				tone={tone}
				title="변경한 내용을 모두 되돌릴까요?"
				subtitle="저장하지 않은 변경이 모두 사라집니다."
			/>
			<div className="flex w-full justify-end gap-3">
				<Button variant="secondary" label="취소" onClick={onCancelClick} />
				<Button variant="dangerSolid" label="되돌리기" onClick={props.onRevertClick} />
			</div>
		</ModalFrame>
	);
}
