import { cva } from "class-variance-authority";
import type { ComponentProps, MouseEvent } from "react";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/utils/cn";
import { SOUND_NAMES } from "@/utils/soundEngine";

const startButton = cva(
	[
		"typo-label-cta flex h-28 w-120 items-center justify-center overflow-clip",
		"whitespace-nowrap rounded-full border-3",
	],
	{
		variants: {
			state: {
				default: [
					"cursor-pointer border-brand-primary-strong bg-brand-accent text-text-on-brand shadow-lg",
					"active:bg-brand-primary-strong active:shadow-sm",
					"shine-sweep animate-breathe active:animate-none active:scale-95",
				],
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
	onClick,
	...props
}: StartButtonProps) {
	const play = useSound();

	function handleClick(event: MouseEvent<HTMLButtonElement>) {
		play(SOUND_NAMES.start);
		onClick?.(event);
	}

	return (
		<button
			type="button"
			disabled={state === "disabled"}
			className={cn(startButton({ state }), className)}
			onClick={handleClick}
			{...props}>
			{label}
		</button>
	);
}
