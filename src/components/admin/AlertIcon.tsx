import { cva, type VariantProps } from "class-variance-authority";
import icAlert from "@/assets/images/icAlert.svg";
import { cn } from "@/utils/cn";

const alertIconVariants = cva("inline-block size-6 shrink-0", {
	variants: {
		tone: {
			info: "bg-brand-primary-strong",
			error: "bg-state-error",
		},
	},
	defaultVariants: {
		tone: "info",
	},
});

const MASK_STYLE = {
	maskImage: `url(${icAlert})`,
	maskSize: "100% 100%",
	maskRepeat: "no-repeat",
};

type AlertIconProps = VariantProps<typeof alertIconVariants> & {
	className?: string;
};

export default function AlertIcon({ tone, className }: AlertIconProps) {
	return (
		<span
			aria-hidden="true"
			className={cn(alertIconVariants({ tone }), className)}
			style={MASK_STYLE}
		/>
	);
}
