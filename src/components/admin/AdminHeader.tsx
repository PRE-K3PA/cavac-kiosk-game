import Button from "@/components/admin/Button";
import InlineNotice from "@/components/admin/InlineNotice";
import { cn } from "@/utils/cn";

type AdminHeaderProps = {
	isUnsaved?: boolean;
	/** 넘기면 "관리자 종료" 왼쪽에 "PIN 변경" 버튼을 보여 줍니다 */
	onPinChangeClick?: () => void;
	onExitClick?: () => void;
	className?: string;
};

export default function AdminHeader({
	isUnsaved = false,
	onPinChangeClick,
	onExitClick,
	className,
}: AdminHeaderProps) {
	return (
		<header
			className={cn(
				"flex h-32 w-full items-center gap-6 border-b-2 border-border-default",
				"bg-background-surface-subtle px-12",
				className,
			)}>
			<h1 className="typo-admin-title whitespace-nowrap text-text-primary">관리자 설정</h1>
			{isUnsaved && <InlineNotice tone="info" message="저장되지 않은 변경이 있습니다" />}
			{onPinChangeClick && (
				<Button
					variant="secondary"
					label="PIN 변경"
					className="ml-auto h-20 w-50 shrink-0"
					onClick={onPinChangeClick}
				/>
			)}
			<Button
				variant="secondary"
				label="관리자 종료"
				className={cn("h-20 w-50 shrink-0", !onPinChangeClick && "ml-auto")}
				onClick={onExitClick}
			/>
		</header>
	);
}
