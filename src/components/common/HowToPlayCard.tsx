import type { ComponentProps, ReactNode } from "react";
import { TipBubble } from "@/components/common/TipBubble";
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

export function HowToPlayCard({
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
				isRow ? "h-[7.625rem] w-[15.625rem]" : "h-[8.75rem] w-[18.75rem]",
			)}>
			{media}
		</div>
	) : null;

	return (
		<div
			className={cn(
				"relative flex items-center gap-[1.5rem] rounded-[1.5rem] border-2 border-border-default",
				"bg-background-surface py-[3rem] shadow-md",
				isRow ? "w-[59.5rem] px-[2rem]" : "w-[36.333312rem] flex-col px-[2.5rem] opacity-90",
				className,
			)}
			{...props}>
			<span
				className={cn(
					"typo-label-m flex shrink-0 items-center justify-center overflow-clip border-3",
					isRow ? "size-[4.5rem] rounded-[2.25rem]" : "size-[3rem] rounded-[1.5rem]",
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
					className={cn(
						"absolute right-[-0.125rem]",
						isRow ? "bottom-[-2.875rem]" : "top-[-3.96875rem]",
					)}
				/>
			)}
		</div>
	);
}
