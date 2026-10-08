import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const titleVariants = cva("typo-admin-title whitespace-nowrap", {
	variants: {
		tone: {
			common: "text-tone-common",
			vaccine: "text-tone-vaccine",
			card: "text-tone-card",
			danger: "text-state-error",
			success: "text-state-success-strong",
		},
	},
	defaultVariants: {
		tone: "common",
	},
});

type ModalHeaderProps = VariantProps<typeof titleVariants> & {
	title: string;
	subtitle?: string;
	className?: string;
};

export default function ModalHeader({ tone, title, subtitle, className }: ModalHeaderProps) {
	return (
		<div className={cn("flex flex-col items-start gap-1", className)}>
			<h2 className={titleVariants({ tone })}>{title}</h2>
			{subtitle && <p className="typo-admin-body text-text-secondary">{subtitle}</p>}
		</div>
	);
}
