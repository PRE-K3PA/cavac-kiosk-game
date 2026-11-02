import Button from "@/components/admin/Button";
import ModalFrame from "@/components/admin/ModalFrame";
import ModalHeader from "@/components/admin/ModalHeader";
import { cn } from "@/utils/cn";

type DeleteConfirmModalProps = {
	target: string;
	warningMessage?: string;
	onCancelClick?: () => void;
	onDeleteClick?: () => void;
	className?: string;
};

export default function DeleteConfirmModal({
	target,
	warningMessage,
	onCancelClick,
	onDeleteClick,
	className,
}: DeleteConfirmModalProps) {
	return (
		<ModalFrame className={className}>
			<ModalHeader tone="danger" title="삭제하시겠습니까?" />
			<p
				className={cn(
					"flex min-h-14 w-full items-center rounded-xl border-2 border-border-default",
					"bg-background-surface-subtle px-4 py-2.5 typo-admin-label text-text-primary",
				)}>
				{target}
			</p>
			<p className="typo-admin-caption text-text-secondary">설정을 저장하면 되돌릴 수 없습니다.</p>
			{warningMessage && (
				<p
					className={cn(
						"w-full rounded-xl border-2 border-state-error bg-background-surface px-4 py-3",
						"typo-admin-body text-state-error",
					)}>
					{warningMessage}
				</p>
			)}
			<div className="flex w-full justify-end gap-3">
				<Button variant="secondary" label="취소" onClick={onCancelClick} />
				<Button variant="dangerSolid" label="삭제" onClick={onDeleteClick} />
			</div>
		</ModalFrame>
	);
}
