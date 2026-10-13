import icAlert from "@/assets/icons/icAlert.svg";
import Button from "@/components/admin/Button";
import Icon from "@/components/admin/Icon";
import { cn } from "@/utils/cn";

type SaveBarProps = {
	summary?: string;
	isCancelDisabled?: boolean;
	isSaveDisabled?: boolean;
	onCancelClick?: () => void;
	onSaveClick?: () => void;
	className?: string;
};

export default function SaveBar({
	summary,
	isCancelDisabled = false,
	isSaveDisabled = false,
	onCancelClick,
	onSaveClick,
	className,
}: SaveBarProps) {
	const isBlocked = Boolean(summary);

	return (
		<footer
			className={cn(
				"flex h-30 w-full items-center justify-end gap-4 border-t-2 border-border-default",
				"bg-background-surface-subtle px-12",
				className,
			)}>
			{isBlocked && (
				<div role="alert" className="flex min-w-0 flex-1 items-center gap-2">
					<Icon src={icAlert} className="bg-state-error" />
					<p className="min-w-0 flex-1 typo-admin-body text-state-error">{summary}</p>
				</div>
			)}
			<Button
				variant="secondary"
				label="변경 취소"
				className="h-22 w-60"
				disabled={isCancelDisabled}
				onClick={onCancelClick}
			/>
			<Button
				variant="primary"
				label="설정 저장"
				className="h-22 w-60"
				disabled={isBlocked || isSaveDisabled}
				onClick={onSaveClick}
			/>
		</footer>
	);
}
