import { cva } from "class-variance-authority";
import { cn } from "@/utils/cn";

const frameVariants = cva(
	"flex items-center justify-center border-solid border-border-default bg-background-surface shadow-md",
	{
		variants: {
			size: {
				default: "h-105 w-150 rounded-3xl border-4 p-6",
				large: "h-147 w-210 rounded-[34px] border-6 p-8.5",
			},
		},
		defaultVariants: { size: "default" },
	},
);

const imageVariants = cva("size-full object-contain", {
	variants: {
		size: {
			default: "rounded-2xl",
			large: "rounded-[22px]",
		},
	},
	defaultVariants: { size: "default" },
});

type ProductResultCardProps = {
	size?: "default" | "large";
	image: string;
	alt?: string;
	className?: string;
};

export function ProductResultCard({
	size = "default",
	image,
	alt = "",
	className,
}: ProductResultCardProps) {
	return (
		<div className={cn(frameVariants({ size }), className)}>
			<img alt={alt} src={image} className={imageVariants({ size })} />
		</div>
	);
}
