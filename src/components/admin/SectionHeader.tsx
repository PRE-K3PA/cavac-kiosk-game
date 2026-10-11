import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/utils/cn";

const titleVariants = cva("typo-admin-section whitespace-nowrap", {
	variants: {
		tone: {
			common: "text-tone-common",
			vaccine: "text-tone-vaccine",
			card: "text-tone-card",
		},
	},
	defaultVariants: {
		tone: "common",
	},
});

type SectionHeaderProps = VariantProps<typeof titleVariants> & {
	title: string;
	description?: string;
	className?: string;
};

export default function SectionHeader({ tone, title, description, className }: SectionHeaderProps) {
	return (
		<div className={cn("flex flex-col items-start gap-1", className)}>
			<h3 className={titleVariants({ tone })}>{title}</h3>
			{description && <p className="typo-admin-caption text-text-secondary">{description}</p>}
		</div>
	);
}
