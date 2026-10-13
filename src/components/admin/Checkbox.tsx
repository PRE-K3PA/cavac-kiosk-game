import type { ChangeEvent, ComponentProps } from "react";
import icCheck from "@/assets/images/icCheck.svg";
import Icon from "@/components/admin/Icon";
import { cn } from "@/utils/cn";

type CheckboxProps = Omit<ComponentProps<"input">, "type" | "checked" | "onChange"> & {
	isChecked: boolean;
	onChange?: (isChecked: boolean) => void;
};

export default function Checkbox({ isChecked, onChange, className, ...props }: CheckboxProps) {
	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		onChange?.(event.target.checked);
	}

	return (
		<span className={cn("relative flex size-9 shrink-0", className)}>
			<input
				type="checkbox"
				checked={isChecked}
				onChange={handleChange}
				className={cn(
					"peer size-full appearance-none rounded-lg",
					"border-2 border-border-default bg-background-surface",
					"checked:border-4 checked:bg-background-canvas",
					"disabled:border-2 disabled:border-border-muted disabled:bg-background-muted",
				)}
				{...props}
			/>
			<Icon
				src={icCheck}
				className={cn(
					"pointer-events-none invisible absolute top-2 left-2 size-5 text-text-primary",
					"peer-checked:visible peer-disabled:text-text-placeholder",
				)}
			/>
		</span>
	);
}
