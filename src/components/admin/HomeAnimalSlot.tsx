import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type HomeAnimal = {
	name: string;
	imageSrc: string;
};

type HomeAnimalSlotProps = Omit<ComponentProps<"button">, "children"> & {
	slotLabel: string;
	animal?: HomeAnimal;
	isSelected?: boolean;
};

export default function HomeAnimalSlot({
	slotLabel,
	animal,
	isSelected = false,
	className,
	type = "button",
	...props
}: HomeAnimalSlotProps) {
	return (
		<button
			type={type}
			aria-pressed={isSelected}
			className={cn("flex w-32 flex-col items-center gap-2 whitespace-nowrap", className)}
			{...props}>
			<span
				className={cn(
					"flex size-32 shrink-0 flex-col items-center justify-center overflow-hidden rounded-2xl",
					"bg-background-surface text-text-secondary",
					isSelected && "border-4 border-tone-common",
					!isSelected && animal && "border-2 border-border-default",
					!isSelected && !animal && "border-2 border-dashed border-border-placeholder",
				)}>
				{animal ? (
					<img src={animal.imageSrc} alt="" className="size-full object-contain" />
				) : (
					<>
						<span className="typo-admin-title">+</span>
						<span className="typo-admin-caption">동물 선택</span>
					</>
				)}
			</span>
			<span
				className={cn("typo-admin-label", animal ? "text-text-primary" : "text-text-placeholder")}>
				{animal?.name ?? "비어 있음"}
			</span>
			<span className="typo-admin-caption text-text-secondary">{slotLabel}</span>
		</button>
	);
}
