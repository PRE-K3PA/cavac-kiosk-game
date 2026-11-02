import type { ComponentProps, MouseEvent } from "react";
import { useSound } from "@/hooks/useSound";
import type { Language } from "@/types/data";
import { cn } from "@/utils/cn";
import { SOUND_NAMES } from "@/utils/soundEngine";

type LanguageButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
	label: string;
	language?: Language;
};

export default function LanguageButton({
	label,
	language = "ko",
	className,
	onClick,
	...props
}: LanguageButtonProps) {
	const play = useSound();

	function handleClick(event: MouseEvent<HTMLButtonElement>) {
		play(SOUND_NAMES.button);
		onClick?.(event);
	}

	return (
		<button
			type="button"
			aria-label={label}
			className={cn(
				"typo-caption flex size-22 cursor-pointer items-center justify-center overflow-clip",
				"rounded-full border-2 border-border-default bg-background-surface text-text-primary",
				"shadow-md",
				className,
			)}
			onClick={handleClick}
			{...props}>
			{language === "en" ? "EN/한" : "한/EN"}
		</button>
	);
}
