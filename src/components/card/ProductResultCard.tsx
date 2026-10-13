import { cva } from "class-variance-authority";
import { RESULT_CARD_FRAME } from "@/components/common/resultCardStyle";
import { cn } from "@/utils/cn";

const frameVariants = cva(
	[
		"flex items-center justify-center border-solid border-border-default",
		"bg-background-surface shadow-md",
	],
	{
		variants: {
			size: {
				default: RESULT_CARD_FRAME.default,
				large: RESULT_CARD_FRAME.large,
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

export default function ProductResultCard({
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
