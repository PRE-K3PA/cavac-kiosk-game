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
		<div className={cn("flex w-[292px] flex-col gap-[2px]", className)} {...props}>
			<p className="typo-label-m whitespace-nowrap text-text-secondary">{label}</p>
			<div
				className={cn(
					"flex h-[84px] w-full items-center justify-center overflow-clip rounded-[16px] border-2 border-border-default",
					tone === "subtle" ? "bg-background-surface-subtle" : "bg-background-surface",
				)}>
				<p className="typo-display-m whitespace-nowrap pt-[8px] font-display text-text-primary">
					{value}
				</p>
			</div>
		</div>
	);
}
