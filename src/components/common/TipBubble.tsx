import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type TipBubbleProps = Omit<ComponentProps<"div">, "children"> & {
	badge?: string;
	message: string;
	tail?: "down" | "up";
};

export default function TipBubble({
	badge = "TIP",
	message,
	tail = "down",
	className,
	...props
}: TipBubbleProps) {
	const isUp = tail === "up";
	return (
		<div className={cn("relative h-21.75 w-max min-w-112.75", className)} {...props}>
			<div
				className={cn(
					"relative flex h-18 items-center justify-center gap-2",
					"rounded-3xl border-3 border-accent-yellow bg-accent-yellow-subtle px-6",
					"shadow-lg",
					isUp && "mt-3.75",
				)}>
				<span
					className={cn(
						"typo-label-s flex h-9 w-16 shrink-0 items-center justify-center",
						"rounded-full bg-accent-amber text-text-inverse",
					)}>
					{badge}
				</span>
				<p className="typo-body-m whitespace-nowrap text-text-primary">{message}</p>
			</div>
			<span
				aria-hidden="true"
				className={cn(
					"absolute left-16.5 h-3.75 w-7.25 bg-accent-yellow",
					isUp ? "top-0 tip-tail-up" : "top-18 tip-tail-down",
				)}
			/>
			<span
				aria-hidden="true"
				className={cn(
					"absolute left-16.5 h-3.5 w-7.25 bg-accent-yellow-subtle",
					isUp ? "top-1 tip-tail-inner-up" : "top-17.25 tip-tail-inner-down",
				)}
			/>
		</div>
	);
}
