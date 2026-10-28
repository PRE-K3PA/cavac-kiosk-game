import type { ComponentProps, MouseEvent } from "react";
import { useSound } from "@/hooks/useSound";
import { cn } from "@/utils/cn";
import { SOUND_NAMES } from "@/utils/soundEngine";

type HomeButtonProps = Omit<ComponentProps<"button">, "children"> & {
	label: string;
};

export default function HomeButton({ label, className, onClick, ...props }: HomeButtonProps) {
	const play = useSound();

	function handleClick(event: MouseEvent<HTMLButtonElement>) {
		play(SOUND_NAMES.button);
		onClick?.(event);
	}

	return (
		<button
			type="button"
			className={cn(
				"typo-label-button flex h-37 w-150 cursor-pointer items-center justify-center",
				"overflow-clip whitespace-nowrap rounded-full border-3 border-border-strong",
				"bg-accent-sky-subtle text-brand-secondary-strong shadow-md",
				"active:bg-background-canvas active:shadow-sm",
				"shine-sweep animate-breathe active:animate-none active:scale-95 disabled:animate-none",
				className,
			)}
			onClick={handleClick}
			{...props}>
			{label}
		</button>
	);
}
