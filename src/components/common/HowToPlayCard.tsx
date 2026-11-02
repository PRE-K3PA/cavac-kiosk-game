import type { ComponentProps, ReactNode } from "react";
import TipBubble from "@/components/common/TipBubble";
import { cn } from "@/utils/cn";

type HowToPlayCardProps = Omit<ComponentProps<"div">, "children"> & {
	step: string;
	description: string;
	direction?: "column" | "row";
	accent?: "blue" | "yellow" | "green";
	media?: ReactNode;
	tip?: string;
};

const STEP_ACCENT = {
	blue: "border-border-strong bg-background-canvas text-brand-secondary-strong",
	yellow: "border-accent-yellow bg-accent-yellow-subtle text-accent-yellow-text",
	green: "border-state-success bg-accent-green-subtle text-state-success",
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
				"relative flex items-center gap-6 rounded-3xl border-2 border-border-default",
				"bg-background-surface py-12 shadow-md",
				isRow ? "w-238 px-8" : "w-145.25 flex-col px-10 opacity-90",
				className,
			)}
			{...props}>
			<span
				className={cn(
					"typo-label-m flex shrink-0 items-center justify-center overflow-clip border-3",
					"rounded-full",
					isRow ? "size-18" : "size-12",
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
					className={cn("absolute -right-0.5", isRow ? "-bottom-11.5" : "-top-16")}
				/>
			)}
		</div>
	);
}
