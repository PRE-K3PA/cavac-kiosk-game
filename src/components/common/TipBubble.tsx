import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type TipBubbleProps = Omit<ComponentProps<"div">, "children"> & {
	badge?: string;
	message: string;
	tail?: "down" | "up";
};

export function TipBubble({
	badge = "TIP",
	message,
	tail = "down",
	className,
	...props
}: TipBubbleProps) {
	const isUp = tail === "up";
	return (
		<div className={cn("relative h-[5.4375rem] w-max min-w-[28.1875rem]", className)} {...props}>
			<div
				className={cn(
					"absolute inset-x-0 flex h-[4.5rem] items-center justify-center gap-[0.5rem]",
					"rounded-[1.5rem] border-3 border-accent-yellow bg-accent-yellow-subtle px-[1.5rem]",
					"shadow-lg",
					isUp ? "top-[0.9375rem]" : "top-0",
				)}>
				<span
					className={cn(
						"typo-label-s flex h-[2.25rem] w-[4rem] shrink-0 items-center justify-center",
						"rounded-[1.125rem] bg-accent-amber text-text-inverse",
					)}>
					{badge}
				</span>
				<p className="typo-body-m whitespace-nowrap text-text-primary">{message}</p>
			</div>
			<span
				aria-hidden="true"
				className={cn(
					"absolute left-[4.1425rem] h-[0.9375rem] w-[1.84rem] bg-accent-yellow",
					isUp
						? "top-0 [clip-path:polygon(50%_0,100%_100%,0_100%)]"
						: "top-[4.5rem] [clip-path:polygon(0_0,100%_0,50%_100%)]",
				)}
			/>
			<span
				aria-hidden="true"
				className={cn(
					"absolute left-[4.1425rem] h-[0.8625rem] w-[1.84rem] bg-accent-yellow-subtle",
					isUp
						? "top-[0.2625rem] [clip-path:polygon(50%_0,95.6%_100%,4.4%_100%)]"
						: "top-[4.3125rem] [clip-path:polygon(4.4%_0,95.6%_0,50%_100%)]",
				)}
			/>
		</div>
	);
}
