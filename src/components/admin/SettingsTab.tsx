import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { ADMIN_TONE_LABEL } from "@/components/admin/adminToneLabel";
import { cn } from "@/utils/cn";

const settingsTabVariants = cva(
	[
		"flex h-24 w-71.5 items-center justify-center rounded-2xl px-5",
		"typo-admin-label whitespace-nowrap",
		"disabled:border-2 disabled:border-border-muted disabled:bg-background-muted",
		"disabled:text-text-placeholder",
	],
	{
		variants: {
			tone: {
				common: "",
				vaccine: "",
				card: "",
			},
			isActive: {
				true: "border-3",
				false: "border-2 border-background-canvas bg-background-surface text-text-secondary",
			},
		},
		compoundVariants: [
			{
				tone: "common",
				isActive: true,
				className: "border-tone-common bg-tone-common-subtle text-tone-common",
			},
			{
				tone: "vaccine",
				isActive: true,
				className: "border-tone-vaccine bg-tone-vaccine-subtle text-tone-vaccine",
			},
			{
				tone: "card",
				isActive: true,
				className: "border-tone-card bg-tone-card-subtle text-tone-card",
			},
		],
		defaultVariants: {
			tone: "common",
			isActive: false,
		},
	},
);

type SettingsTabProps = Omit<ComponentProps<"button">, "children"> &
	VariantProps<typeof settingsTabVariants>;

export default function SettingsTab({
	tone,
	isActive,
	className,
	type = "button",
	...props
}: SettingsTabProps) {
	return (
		<button
			type={type}
			aria-pressed={isActive ?? false}
			className={cn(settingsTabVariants({ tone, isActive }), className)}
			{...props}>
			{ADMIN_TONE_LABEL[tone ?? "common"]}
		</button>
	);
}
