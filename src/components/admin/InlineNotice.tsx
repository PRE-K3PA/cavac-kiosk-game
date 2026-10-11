import { cva, type VariantProps } from "class-variance-authority";
import AlertIcon from "@/components/admin/AlertIcon";
import { cn } from "@/utils/cn";

const inlineNoticeVariants = cva(
	[
		"flex h-11 shrink-0 items-center gap-2 rounded-lg border-2 px-4",
		"typo-admin-body whitespace-nowrap",
	],
	{
		variants: {
			tone: {
				info: "border-accent-amber bg-accent-yellow-subtle text-brand-primary-strong",
				error: "border-state-error bg-background-surface text-state-error",
			},
		},
		defaultVariants: {
			tone: "info",
		},
	},
);

type InlineNoticeProps = VariantProps<typeof inlineNoticeVariants> & {
	message: string;
	className?: string;
};

export default function InlineNotice({ tone, message, className }: InlineNoticeProps) {
	return (
		<div role="status" className={cn(inlineNoticeVariants({ tone }), className)}>
			<AlertIcon tone={tone} className="size-5" />
			<p>{message}</p>
		</div>
	);
}
