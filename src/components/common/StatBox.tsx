import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type StatBoxProps = Omit<ComponentProps<"div">, "children"> & {
	label?: string;
	value: string;
	tone?: "subtle" | "surface";
};

export default function StatBox({
	label = "SCORE",
	value,
	tone = "subtle",
	className,
	...props
}: StatBoxProps) {
	return (
		<div className={cn("flex w-73 flex-col gap-0.5", className)} {...props}>
			<p className="typo-label-m whitespace-nowrap text-text-secondary">{label}</p>
			<div
				className={cn(
					"flex h-21 w-full items-center justify-center overflow-clip rounded-[16px]",
					"border-2 border-border-default",
					tone === "subtle" ? "bg-background-surface-subtle" : "bg-background-surface",
				)}>
				<p className="typo-display-m whitespace-nowrap pt-2 font-display text-text-primary">
					{value}
				</p>
			</div>
		</div>
	);
}
