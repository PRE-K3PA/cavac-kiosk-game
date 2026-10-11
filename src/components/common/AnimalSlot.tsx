import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

type AnimalSlotProps = Omit<ComponentProps<"div">, "children"> & {
	side?: "left" | "right";
	state?: "filled" | "empty";
	src?: string;
	name?: string;
};

export function AnimalSlot({
	side = "left",
	state = "filled",
	src,
	name = "",
	className,
	...props
}: AnimalSlotProps) {
	return (
		<div className={cn("relative size-[12.5rem]", className)} {...props}>
			{state === "empty" ? (
				<div
					className={cn(
						"absolute inset-0 rounded-[1.5rem] border-3",
						"border-border-placeholder border-dashed",
					)}
				/>
			) : (
				<>
					<div
						aria-hidden="true"
						className={cn(
							"absolute inset-[84%_20%_8%_20%] rounded-full bg-(--black)/60",
							"opacity-35 blur-[0.1875rem]",
						)}
					/>
					{src && (
						<img
							src={src}
							alt={name}
							draggable={false}
							className={cn(
								"absolute inset-0 size-full object-cover",
								side === "left" && "-scale-x-100",
							)}
						/>
					)}
				</>
			)}
		</div>
	);
}
