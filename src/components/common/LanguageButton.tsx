import type { ComponentProps } from "react";
import type { Language } from "@/types/data";
import { cn } from "@/utils/cn";

type LanguageButtonProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
	label: string;
	language?: Language;
};

export default function LanguageButton({
	label,
	language = "ko",
	className,
	...props
}: LanguageButtonProps) {
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
			{...props}>
			{language === "en" ? "EN/한" : "한/EN"}
		</button>
	);
}
