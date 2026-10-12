import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type HomeButtonProps = Omit<ComponentProps<"button">, "children"> & {
	label: string;
};

export default function HomeButton({ label, className, ...props }: HomeButtonProps) {
	return (
		<button
			type="button"
			className={cn(
				"typo-label-button flex h-37 w-150 cursor-pointer items-center justify-center",
				"overflow-clip whitespace-nowrap rounded-full border-3 border-border-default",
				"bg-background-surface text-text-primary shadow-md",
				className,
			)}
			{...props}>
			{label}
		</button>
	);
}
