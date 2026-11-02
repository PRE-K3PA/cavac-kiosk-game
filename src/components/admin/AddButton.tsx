import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type AddButtonProps = Omit<ComponentProps<"button">, "children"> & {
	label: string;
};

export default function AddButton({ label, className, type = "button", ...props }: AddButtonProps) {
	return (
		<button
			type={type}
			className={cn(
				"flex h-16 w-150 items-center justify-center rounded-xl",
				"border-2 border-dashed border-border-default",
				"typo-admin-label whitespace-nowrap text-text-primary",
				"active:bg-background-canvas",
				"disabled:border-border-muted disabled:text-text-placeholder",
				className,
			)}
			{...props}>
			+ {label}
		</button>
	);
}
