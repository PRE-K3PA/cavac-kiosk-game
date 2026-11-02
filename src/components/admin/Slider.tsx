import { cva, type VariantProps } from "class-variance-authority";
import { type KeyboardEvent, type PointerEvent, useRef } from "react";
import { cn } from "@/utils/cn";

const fillVariants = cva("absolute top-3.5 left-0 h-3 rounded-lg", {
	variants: {
		tone: {
			neutral: "bg-text-secondary",
			accent: "bg-brand-secondary",
		},
	},
	defaultVariants: {
		tone: "neutral",
	},
});

type SliderProps = VariantProps<typeof fillVariants> & {
	min: number;
	max: number;
	value: number;
	step?: number;
	unit?: string;
	label?: string;
	disabled?: boolean;
	onChange?: (value: number) => void;
	className?: string;
};

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export default function Slider({
	min,
	max,
	value,
	step = 1,
	unit = "",
	tone,
	label,
	disabled = false,
	onChange,
	className,
}: SliderProps) {
	const trackRef = useRef<HTMLDivElement>(null);
	const ratio = max > min ? (clamp(value, min, max) - min) / (max - min) : 0;

	function changeValue(next: number) {
		const stepped = Math.round((next - min) / step) * step + min;
		const clamped = clamp(stepped, min, max);
		if (clamped !== value) onChange?.(clamped);
	}

	function changeValueFromPointer(clientX: number) {
		const track = trackRef.current;
		if (!track) return;
		const rect = track.getBoundingClientRect();
		const handleSize = rect.height;
		const usable = rect.width - handleSize;
		if (usable <= 0) return;
		const nextRatio = clamp((clientX - rect.left - handleSize / 2) / usable, 0, 1);
		changeValue(min + nextRatio * (max - min));
	}

	function handleTrackPointerDown(event: PointerEvent<HTMLDivElement>) {
		if (disabled) return;
		event.currentTarget.setPointerCapture(event.pointerId);
		changeValueFromPointer(event.clientX);
	}

	function handleTrackPointerMove(event: PointerEvent<HTMLDivElement>) {
		if (disabled || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
		changeValueFromPointer(event.clientX);
	}

	function handleTrackKeyDown(event: KeyboardEvent<HTMLDivElement>) {
		if (disabled) return;
		if (event.key === "ArrowLeft" || event.key === "ArrowDown") changeValue(value - step);
		else if (event.key === "ArrowRight" || event.key === "ArrowUp") changeValue(value + step);
		else return;
		event.preventDefault();
	}

	return (
		<div className={cn("flex h-14 items-center gap-3", disabled && "opacity-40", className)}>
			<span className="typo-admin-caption whitespace-nowrap text-text-secondary">
				{min}
				{unit}
			</span>
			<div
				ref={trackRef}
				role="slider"
				tabIndex={disabled ? -1 : 0}
				aria-label={label}
				aria-valuemin={min}
				aria-valuemax={max}
				aria-valuenow={value}
				aria-valuetext={`${value}${unit}`}
				aria-disabled={disabled}
				className="relative h-10 w-70 shrink-0 touch-none"
				onPointerDown={handleTrackPointerDown}
				onPointerMove={handleTrackPointerMove}
				onKeyDown={handleTrackKeyDown}>
				<div
					className={cn(
						"absolute inset-x-0 top-3.5 h-3 rounded-lg",
						"border-2 border-border-default bg-background-canvas",
					)}
				/>
				<div className={fillVariants({ tone })} style={{ width: `${ratio * 100}%` }} />
				<div
					className={cn(
						"absolute top-0 size-10 rounded-full",
						"border-3 border-text-primary bg-background-surface",
					)}
					style={{ left: `calc(${ratio} * (100% - 2.5rem))` }}
				/>
			</div>
			<span className="typo-admin-caption whitespace-nowrap text-text-secondary">
				{max}
				{unit}
			</span>
			<span
				className={cn(
					"flex h-14 w-24 shrink-0 items-center justify-center rounded-xl",
					"border-2 border-border-default bg-background-surface-subtle",
					"typo-admin-label whitespace-nowrap text-text-primary",
				)}>
				{value}
				{unit}
			</span>
		</div>
	);
}
