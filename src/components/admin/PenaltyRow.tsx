import { cva } from "class-variance-authority";
import { type ChangeEvent, useId } from "react";
import Checkbox from "@/components/admin/Checkbox";
import { cn } from "@/utils/cn";

const penaltyRowVariants = cva(
	"flex h-18 w-127 items-center gap-3 rounded-xl border-border-default px-4",
	{
		variants: {
			isChecked: {
				true: "border-4 bg-background-surface-subtle",
				false: "border-2",
			},
		},
	},
);

const valueInputVariants = cva(
	[
		"h-14 w-22 rounded-lg border-2 bg-background-surface px-4 text-right outline-none",
		"typo-admin-label text-text-primary focus:border-3 disabled:text-text-placeholder",
	],
	{
		variants: {
			isError: {
				true: "border-state-error",
				false: "border-border-default focus:border-tone-common",
			},
		},
	},
);

type PenaltyRowProps = {
	label: string;
	unit: string;
	isChecked: boolean;
	value: number | null;
	maxLength?: number;
	isError?: boolean;
	onCheckedChange?: (isChecked: boolean) => void;
	onValueChange?: (value: number | null) => void;
	className?: string;
};

function parseDigits(text: string) {
	const digits = text.replace(/\D/g, "");
	return digits === "" ? null : Number(digits);
}

export default function PenaltyRow({
	label,
	unit,
	isChecked,
	value,
	maxLength = 3,
	isError = false,
	onCheckedChange,
	onValueChange,
	className,
}: PenaltyRowProps) {
	const checkboxId = useId();
	const isValueError = isChecked && isError;

	function handleValueChange(event: ChangeEvent<HTMLInputElement>) {
		onValueChange?.(parseDigits(event.target.value));
	}

	return (
		<div className={cn(penaltyRowVariants({ isChecked }), className)}>
			<label htmlFor={checkboxId} className="flex min-w-0 flex-1 items-center gap-3 self-stretch">
				<Checkbox id={checkboxId} isChecked={isChecked} onChange={onCheckedChange} />
				<span
					className={cn(
						"typo-admin-label whitespace-nowrap",
						isChecked ? "text-text-primary" : "text-text-secondary",
					)}>
					{label}
				</span>
			</label>
			<div className="flex shrink-0 items-center gap-2">
				<input
					inputMode="numeric"
					maxLength={maxLength}
					value={value ?? ""}
					disabled={!isChecked}
					aria-label={label}
					aria-invalid={isValueError}
					onChange={handleValueChange}
					className={valueInputVariants({ isError: isValueError })}
				/>
				<span className="typo-admin-caption whitespace-nowrap text-text-secondary">{unit}</span>
			</div>
		</div>
	);
}
