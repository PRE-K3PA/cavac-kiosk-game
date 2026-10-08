import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
	[
		"flex h-15 w-40 items-center justify-center rounded-xl px-6",
		"typo-admin-label whitespace-nowrap",
		"disabled:border-2 disabled:border-border-muted disabled:bg-background-muted",
		"disabled:text-text-placeholder",
	],
	{
		variants: {
			variant: {
				primary: [
					"border-3 border-brand-primary-pressed bg-brand-accent text-text-on-brand",
					"active:bg-brand-primary-pressed",
				],
				secondary: [
					"border-2 border-border-default bg-background-surface text-text-primary",
					"active:bg-background-canvas",
				],
				danger: [
					"border-2 border-state-error bg-background-surface text-state-error",
					"active:bg-background-canvas",
				],
				dangerSolid: [
					"border-3 border-state-error-strong bg-state-error text-text-on-brand",
					"active:bg-state-error-strong",
				],
			},
		},
		defaultVariants: {
			variant: "primary",
		},
	},
);

type ButtonProps = Omit<ComponentProps<"button">, "children"> &
	VariantProps<typeof buttonVariants> & {
		label: string;
	};

export default function Button({
	label,
	variant,
	className,
	type = "button",
	...props
}: ButtonProps) {
	return (
		<button type={type} className={cn(buttonVariants({ variant }), className)} {...props}>
			{label}
		</button>
	);
}
