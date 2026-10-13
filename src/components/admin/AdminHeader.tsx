import { cva, type VariantProps } from "class-variance-authority";
import { ADMIN_TONE_LABEL, ADMIN_TONE_TEXT } from "@/components/admin/adminToneLabel";
import Button from "@/components/admin/Button";
import InlineNotice from "@/components/admin/InlineNotice";
import { cn } from "@/utils/cn";

const toneLabelVariants = cva("typo-admin-label whitespace-nowrap", {
	variants: {
		tone: ADMIN_TONE_TEXT,
	},
	defaultVariants: {
		tone: "common",
	},
});

type AdminHeaderProps = VariantProps<typeof toneLabelVariants> & {
	isUnsaved?: boolean;
	onExitClick?: () => void;
	className?: string;
};

export default function AdminHeader({
	tone,
	isUnsaved = false,
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
			<p className={toneLabelVariants({ tone })}>{ADMIN_TONE_LABEL[tone ?? "common"]}</p>
			{isUnsaved && <InlineNotice tone="info" message="저장되지 않은 변경이 있습니다" />}
			<Button
				variant="secondary"
				label="관리자 종료"
				className="ml-auto h-20 w-70"
				onClick={onExitClick}
			/>
		</header>
	);
}
