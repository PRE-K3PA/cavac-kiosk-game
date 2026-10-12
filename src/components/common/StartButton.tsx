import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

const startButton = cva(
	[
		"typo-label-cta flex h-28 w-120 items-center justify-center overflow-clip",
		"whitespace-nowrap rounded-[56px] border-3",
	],
	{
		variants: {
			state: {
				default:
					"cursor-pointer border-brand-primary-strong bg-brand-accent text-text-on-brand shadow-lg",
				pressed: "border-brand-primary-strong bg-brand-primary-strong text-text-on-brand shadow-sm",
				disabled: "border-border-muted bg-background-muted text-text-secondary",
			},
		},
		defaultVariants: { state: "default" },
	},
);

type StartButtonProps = Omit<ComponentProps<"button">, "children" | "disabled"> & {
	label: string;
	state?: "default" | "pressed" | "disabled";
};

export default function StartButton({
	label,
	state = "default",
	className,
	...props
}: StartButtonProps) {
	return (
		<button
			type="button"
			disabled={state === "disabled"}
			className={cn(startButton({ state }), className)}
			{...props}>
			{label}
		</button>
	);
}
