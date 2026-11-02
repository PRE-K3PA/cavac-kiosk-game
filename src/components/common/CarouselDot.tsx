import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type CarouselDotProps = Omit<ComponentProps<"span">, "children"> & {
	active?: boolean;
};

export default function CarouselDot({ active = true, className, ...props }: CarouselDotProps) {
	return (
		<span
			aria-current={active || undefined}
			className={cn(
				"box-border inline-block shrink-0 rounded-full border-2 border-border-default",
				active ? "size-6 bg-(--slate-600)" : "size-4",
				className,
			)}
			{...props}
		/>
	);
}
