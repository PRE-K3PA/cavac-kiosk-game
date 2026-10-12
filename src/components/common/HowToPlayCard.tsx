import type { ComponentProps, ReactNode } from "react";
import TipBubble from "@/components/common/TipBubble";
import { cn } from "@/utils/cn";

type HowToPlayCardProps = Omit<ComponentProps<"div">, "children"> & {
	step: string;
	description: string;
	direction?: "column" | "row";
	accent?: "blue" | "yellow";
	media?: ReactNode;
	tip?: string;
};

const STEP_ACCENT = {
	blue: "border-border-strong bg-background-canvas text-brand-secondary-strong",
	yellow: "border-accent-yellow bg-accent-yellow-subtle text-accent-yellow-text",
} as const;

export default function HowToPlayCard({
	step,
	description,
	direction = "column",
	accent = "blue",
	media,
	tip,
	className,
	...props
}: HowToPlayCardProps) {
	const isRow = direction === "row";
	const mediaSlot = media ? (
		<div
			className={cn(
				"flex shrink-0 items-center justify-center overflow-clip",
				isRow ? "h-30.5 w-62.5" : "h-35 w-75",
			)}>
			{media}
		</div>
	) : null;

	return (
		<div
			className={cn(
				"relative flex items-center gap-6 rounded-[24px] border-2 border-border-default",
				"bg-background-surface py-12 shadow-md",
				isRow ? "w-238 px-8" : "w-[581.333px] flex-col px-10 opacity-90",
				className,
			)}
			{...props}>
			<span
				className={cn(
					"typo-label-m flex shrink-0 items-center justify-center overflow-clip border-3",
					isRow ? "size-18 rounded-[36px]" : "size-12 rounded-[24px]",
					STEP_ACCENT[accent],
				)}>
				{step}
			</span>
			{isRow ? (
				<>
					<p className="typo-body-l min-w-px flex-1 text-text-primary">{description}</p>
					{mediaSlot}
				</>
			) : (
				<>
					{mediaSlot}
					<p className="typo-body-l w-full text-center text-text-primary">{description}</p>
				</>
			)}
			{tip && (
				<TipBubble
					message={tip}
					tail={isRow ? "up" : "down"}
					className={cn("absolute -right-0.5", isRow ? "-bottom-11.5" : "-top-[63.5px]")}
				/>
			)}
		</div>
	);
}
