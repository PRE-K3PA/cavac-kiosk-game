import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type StatBoxProps = Omit<ComponentProps<"div">, "children"> & {
	label?: string;
	value: string;
	tone?: "subtle" | "surface";
};

export function StatBox({
	label = "SCORE",
	value,
	tone = "subtle",
	className,
	...props
}: StatBoxProps) {
	return (
		<div className={cn("flex w-[18.25rem] flex-col gap-[0.125rem]", className)} {...props}>
			<p className="typo-label-m whitespace-nowrap text-text-secondary">{label}</p>
			<div
				className={cn(
					"flex h-[5.25rem] w-full items-center justify-center overflow-clip rounded-[1rem]",
					"border-2 border-border-default",
					tone === "subtle" ? "bg-background-surface-subtle" : "bg-background-surface",
				)}>
				<p className="typo-display-m whitespace-nowrap pt-[0.5rem] font-display text-text-primary">
					{value}
				</p>
			</div>
		</div>
	);
}
