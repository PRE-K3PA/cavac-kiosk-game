import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import icMatchedBadge from "@/assets/icons/icMatchedBadge.svg";
import imgMemoryLogo from "@/assets/images/card/imgMemoryLogo.png";
import { cn } from "@/utils/cn";

type MemoryCardState = "back" | "front" | "wrong" | "matched";

const memoryCardFaceVariants = cva(
	"absolute inset-0 flex items-center overflow-clip rounded-3xl border-solid backface-hidden",
	{
		variants: {
			state: {
				back: [
					"justify-center border-3 border-border-default",
					"bg-background-surface-subtle p-4.5 shadow-md",
				],
				front: "flex-col border-3 border-border-default bg-background-surface p-3.5 shadow-md",
				wrong: "flex-col border-4 border-state-error bg-background-surface p-3.5 shadow-md",
				matched: "flex-col border-4 border-state-success bg-background-surface p-3.5 shadow-md",
			},
		},
		defaultVariants: { state: "back" },
	},
);

type MemoryCardProps = Omit<ComponentProps<"button">, "children" | "aria-label"> & {
	label: string;
	state?: MemoryCardState;
	productImage?: string;
};

export default function MemoryCard({
	label,
	state = "back",
	productImage,
	disabled,
	className,
	...props
}: MemoryCardProps) {
	const isFaceUp = state !== "back";

	return (
		<button
			type="button"
			aria-label={label}
			aria-pressed={isFaceUp}
			disabled={disabled ?? isFaceUp}
			className={cn(
				"relative h-53 w-74 cursor-pointer perspective-distant disabled:cursor-default",
				className,
			)}
			{...props}>
			<div
				className={cn(
					"size-full transform-3d transition-transform duration-400 ease-in-out",
					isFaceUp && "rotate-y-180",
				)}>
				<div className={memoryCardFaceVariants({ state: "back" })}>
					<div
						className={cn(
							"flex h-full min-w-px flex-1 items-center justify-center overflow-clip",
							"rounded-xl bg-background-surface-subtle px-3.5 py-2.5",
						)}>
						<div className="h-14 w-35 shrink-0">
							<img alt="" src={imgMemoryLogo} className="size-full object-contain opacity-50" />
						</div>
					</div>
				</div>
				<div
					className={cn(
						memoryCardFaceVariants({ state: isFaceUp ? state : "front" }),
						"rotate-y-180",
					)}>
					<div
						className={cn(
							"flex min-h-px w-full flex-1 items-center justify-center overflow-clip",
							"rounded-xl border-2 border-dashed border-border-default",
							"bg-background-surface-subtle p-3",
							state === "matched" && "opacity-55",
						)}>
						<div
							className={cn(
								"flex h-full min-w-px flex-1 items-center justify-center overflow-clip",
								"rounded-lg border-2 border-solid border-border-default",
								"bg-background-surface",
							)}>
							{productImage ? (
								<img alt="" src={productImage} className="size-full object-contain" />
							) : (
								<p className="typo-micro text-text-placeholder">IMG</p>
							)}
						</div>
					</div>
					{state === "matched" && (
						<div className="absolute top-1.5 right-1.5 size-9">
							<div className="absolute -top-1/9 -right-1/6 -bottom-2/9 -left-1/6">
								<img alt="" src={icMatchedBadge} className="block size-full max-w-none" />
							</div>
						</div>
					)}
				</div>
			</div>
		</button>
	);
}
