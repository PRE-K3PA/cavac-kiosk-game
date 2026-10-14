import { cva } from "class-variance-authority";
import type { ChangeEvent, ComponentProps } from "react";
import icSearch from "@/assets/icons/icSearch.svg";
import Icon from "@/components/admin/Icon";
import { cn } from "@/utils/cn";

const textInputVariants = cva(
	[
		"flex h-16 w-150 items-center gap-3 rounded-xl border-2 bg-background-surface px-5",
		"focus-within:border-3",
		"has-disabled:border-border-muted has-disabled:bg-background-muted",
	],
	{
		variants: {
			isError: {
				true: "border-state-error",
				false: "border-border-default focus-within:border-tone-common",
			},
		},
	},
);

type TextInputProps = Omit<ComponentProps<"input">, "value" | "onChange"> & {
	value: string;
	isError?: boolean;
	isSearchIconVisible?: boolean;
	onChange?: (value: string) => void;
};

export default function TextInput({
	value,
	isError = false,
	isSearchIconVisible = false,
	onChange,
	className,
	...props
}: TextInputProps) {
	function handleChange(event: ChangeEvent<HTMLInputElement>) {
		onChange?.(event.target.value);
	}

	return (
		<label className={cn(textInputVariants({ isError }), className)}>
			{isSearchIconVisible && <Icon src={icSearch} className="text-border-strong" />}
			<input
				value={value}
				aria-invalid={isError}
				onChange={handleChange}
				className={cn(
					"min-w-0 flex-1 bg-transparent outline-none",
					"typo-admin-label text-text-primary placeholder:text-text-placeholder",
					"disabled:text-text-placeholder",
				)}
				{...props}
			/>
		</label>
	);
}
