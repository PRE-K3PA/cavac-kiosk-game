import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type CarouselDotProps = Omit<ComponentProps<"span">, "children"> & {
	active?: boolean;
};

export function CarouselDot({ active = true, className, ...props }: CarouselDotProps) {
	return (
		<span
			aria-current={active || undefined}
			className={cn(
				"box-border inline-block shrink-0 rounded-full border-2 border-border-default",
				active ? "size-[1.5rem] bg-(--slate-600)" : "size-[1rem]",
				className,
			)}
			{...props}
		/>
	);
}
