import { cva } from "class-variance-authority";
import icMatchedBadge from "@/assets/images/card/icMatchedBadge.svg";
import imgMemoryLogo from "@/assets/images/card/imgMemoryLogo.png";
import { cn } from "@/utils/cn";

type MemoryCardState = "back" | "front" | "wrong" | "matched";

const memoryCardVariants = cva(
	"relative flex h-53 w-74 items-center overflow-clip rounded-[20px] border-solid",
	{
		variants: {
			state: {
				back: [
					"justify-center border-3 border-border-default",
					"bg-background-surface-subtle p-4.5 shadow-md",
				],
				front: "flex-col border-3 border-border-default bg-background-surface p-3.5 shadow-md",
				wrong: "flex-col border-4 border-state-error bg-background-surface p-3.5 shadow-md",
				matched:
					"flex-col gap-2.5 border-4 border-state-success bg-background-surface p-3.5 shadow-md",
			},
		},
		defaultVariants: { state: "back" },
	},
);

type MemoryCardProps = {
	state?: MemoryCardState;
	productImage?: string;
	className?: string;
};

export default function MemoryCard({ state = "back", productImage, className }: MemoryCardProps) {
	return (
		<div className={cn(memoryCardVariants({ state }), className)}>
			{state === "back" ? (
				<div
					className={cn(
						"flex h-full min-w-px flex-1 items-center justify-center overflow-clip",
						"rounded-[14px] bg-background-surface-subtle px-3.5 py-2.5",
					)}>
					<div className="h-14 w-35 shrink-0">
						<img alt="" src={imgMemoryLogo} className="size-full object-contain opacity-50" />
					</div>
				</div>
			) : (
				<div
					className={cn(
						"flex min-h-px w-full flex-1 items-center justify-center overflow-clip",
						"rounded-[14px] border-2 border-dashed border-border-default",
						"bg-background-surface-subtle p-3",
						state === "matched" && "opacity-55",
					)}>
					<div
						className={cn(
							"flex h-full min-w-px flex-1 items-center justify-center overflow-clip",
							"rounded-[10px] border-2 border-solid border-border-default",
							"bg-background-surface",
						)}>
						{productImage ? (
							<img alt="" src={productImage} className="size-full object-contain" />
						) : (
							<p className="text-[12px] font-medium leading-[1.3] text-text-placeholder">IMG</p>
						)}
					</div>
				</div>
			)}
			{state === "matched" && (
				<div className="absolute top-1.5 right-1.5 size-9">
					<div className="absolute inset-[-11.11%_-16.67%_-22.22%_-16.67%]">
						<img alt="" src={icMatchedBadge} className="block size-full max-w-none" />
					</div>
				</div>
			)}
		</div>
	);
}
