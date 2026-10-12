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
		<div className={cn("relative h-[87px] w-max min-w-[451px]", className)} {...props}>
			<div
				className={cn(
					"absolute inset-x-0 flex h-18 items-center justify-center gap-2",
					"rounded-[24px] border-3 border-accent-yellow bg-accent-yellow-subtle px-6",
					"shadow-lg",
					isUp ? "top-[15px]" : "top-0",
				)}>
				<span
					className={cn(
						"typo-label-s flex h-9 w-16 shrink-0 items-center justify-center",
						"rounded-[18px] bg-accent-amber text-text-inverse",
					)}>
					{badge}
				</span>
				<p className="typo-body-m whitespace-nowrap text-text-primary">{message}</p>
			</div>
			<span
				aria-hidden="true"
				className={cn(
					"absolute left-[66.28px] h-[15px] w-[29.44px] bg-accent-yellow",
					isUp
						? "top-0 [clip-path:polygon(50%_0,100%_100%,0_100%)]"
						: "top-18 [clip-path:polygon(0_0,100%_0,50%_100%)]",
				)}
			/>
			<span
				aria-hidden="true"
				className={cn(
					"absolute left-[66.28px] h-[13.8px] w-[29.44px] bg-accent-yellow-subtle",
					isUp
						? "top-[4.2px] [clip-path:polygon(50%_0,95.6%_100%,4.4%_100%)]"
						: "top-[69px] [clip-path:polygon(4.4%_0,95.6%_0,50%_100%)]",
				)}
			/>
		</div>
	);
}
