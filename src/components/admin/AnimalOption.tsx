import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

const animalOptionVariants = cva(
	[
		"flex h-42 w-36 shrink-0 flex-col items-center gap-2 rounded-xl border-border-default p-3.5",
		"disabled:opacity-40",
	],
	{
		variants: {
			isSelected: {
				true: "border-4 bg-background-canvas",
				false: "border-2 bg-background-surface",
			},
		},
		defaultVariants: {
			isSelected: false,
		},
	},
);

type AnimalOptionProps = Omit<ComponentProps<"button">, "children"> &
	VariantProps<typeof animalOptionVariants> & {
		name: string;
		imageSrc: string;
	};

export default function AnimalOption({
	name,
	imageSrc,
	isSelected,
	className,
	type = "button",
	...props
}: AnimalOptionProps) {
	return (
		<button
			type={type}
			aria-pressed={isSelected ?? false}
			className={cn(animalOptionVariants({ isSelected }), className)}
			{...props}>
			<span
				className={cn(
					"h-25 w-27 shrink-0 overflow-hidden rounded-lg",
					"border-2 border-border-default bg-background-canvas",
				)}>
				<img src={imageSrc} alt="" className="size-full object-contain" />
			</span>
			<span className="typo-admin-body whitespace-nowrap text-text-primary">{name}</span>
		</button>
	);
}
