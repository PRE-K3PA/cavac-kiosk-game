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
				isRow ? "h-[122px] w-[250px]" : "h-[140px] w-[300px]",
			)}>
			{media}
		</div>
	) : null;

	return (
		<div
			className={cn(
				"relative flex items-center gap-[24px] rounded-[24px] border-2 border-border-default bg-background-surface py-[48px] shadow-md",
				isRow ? "w-[952px] px-[32px]" : "w-[581.333px] flex-col px-[40px] opacity-90",
				className,
			)}
			{...props}>
			<span
				className={cn(
					"typo-label-m flex shrink-0 items-center justify-center overflow-clip border-3",
					isRow ? "size-[72px] rounded-[36px]" : "size-[48px] rounded-[24px]",
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
					className={cn("absolute right-[-2px]", isRow ? "bottom-[-46px]" : "top-[-63.5px]")}
				/>
			)}
		</div>
	);
}
