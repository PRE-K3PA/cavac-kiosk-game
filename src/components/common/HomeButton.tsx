import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type HomeButtonProps = Omit<ComponentProps<"button">, "children"> & {
	label: string;
};

export function HomeButton({ label, className, ...props }: HomeButtonProps) {
	return (
		<button
			type="button"
			className={cn(
				"typo-label-button flex h-[148px] w-[600px] cursor-pointer items-center justify-center overflow-clip whitespace-nowrap rounded-[74px] border-3 border-border-default bg-background-surface text-text-primary shadow-md",
				className,
			)}
			{...props}>
			{label}
		</button>
	);
}
