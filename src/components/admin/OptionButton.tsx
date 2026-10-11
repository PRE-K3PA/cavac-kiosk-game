import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

const optionButtonVariants = cva(
	[
		"flex h-16 w-50 items-center justify-center gap-3 rounded-xl px-4",
		"disabled:border-2 disabled:border-border-muted disabled:bg-background-muted",
		"disabled:text-text-placeholder",
	],
	{
		variants: {
			tone: {
				neutral: "",
				success: "",
				danger: "",
			},
			isSelected: {
				true: "",
				false: "border-2 border-border-default bg-background-surface text-text-secondary",
			},
		},
		compoundVariants: [
			{
				tone: "neutral",
				isSelected: true,
				className: "border-4 border-border-default bg-background-canvas text-text-primary",
			},
			{
				tone: "success",
				isSelected: true,
				className:
					"border-3 border-state-success-strong bg-background-surface text-state-success-strong",
			},
			{
				tone: "danger",
				isSelected: true,
				className: "border-3 border-state-error bg-background-surface text-state-error",
			},
		],
		defaultVariants: {
			tone: "neutral",
			isSelected: false,
		},
	},
);

const radioVariants = cva(
	"flex size-7 shrink-0 items-center justify-center rounded-full border-2 bg-background-surface",
	{
		variants: {
			tone: {
				neutral: "",
				success: "",
				danger: "",
			},
			isSelected: {
				true: "",
				false: "border-border-strong",
			},
		},
		compoundVariants: [
			{ tone: "neutral", isSelected: true, className: "border-tone-common" },
			{ tone: "success", isSelected: true, className: "border-state-success-strong" },
			{ tone: "danger", isSelected: true, className: "border-state-error" },
		],
		defaultVariants: {
			tone: "neutral",
			isSelected: false,
		},
	},
);

const radioDotVariants = cva("size-3.5 rounded-full group-disabled:bg-border-muted", {
	variants: {
		tone: {
			neutral: "bg-tone-common",
			success: "bg-state-success-strong",
			danger: "bg-state-error",
		},
	},
	defaultVariants: {
		tone: "neutral",
	},
});

type OptionButtonProps = Omit<ComponentProps<"button">, "children"> &
	VariantProps<typeof optionButtonVariants> & {
		label: string;
		sublabel?: string;
		isRadioVisible?: boolean;
	};

export default function OptionButton({
	tone,
	isSelected,
	label,
	sublabel,
	isRadioVisible = false,
	className,
	disabled,
	type = "button",
	...props
}: OptionButtonProps) {
	return (
		<button
			type={type}
			aria-pressed={isSelected ?? false}
			disabled={disabled}
			className={cn(optionButtonVariants({ tone, isSelected }), "group", className)}
			{...props}>
			{isRadioVisible && (
				<span
					aria-hidden="true"
					className={cn(
						radioVariants({ tone, isSelected }),
						"group-disabled:border-border-muted group-disabled:bg-background-muted",
					)}>
					{isSelected && <span className={radioDotVariants({ tone })} />}
				</span>
			)}
			<span className="flex flex-col items-center gap-0.5 whitespace-nowrap">
				<span className="typo-admin-label">{label}</span>
				{sublabel && (
					<span
						className={cn(
							"typo-admin-caption",
							isSelected && "text-text-secondary group-disabled:text-text-placeholder",
						)}>
						{sublabel}
					</span>
				)}
			</span>
		</button>
	);
}
