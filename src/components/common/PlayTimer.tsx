import type { ComponentProps } from "react";
import { cn } from "@/utils/cn";

const WARNING_RATIO = 1 / 6;

type PlayTimerProps = Omit<ComponentProps<"div">, "children"> & {
	time: string;
	progress: number;
};

export function PlayTimer({ time, progress, className, ...props }: PlayTimerProps) {
	const ratio = Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
	const isWarning = ratio <= WARNING_RATIO;
	return (
		<div className={cn("flex w-full flex-col items-end gap-[0.375rem]", className)} {...props}>
			<div
				role="progressbar"
				aria-valuemin={0}
				aria-valuemax={100}
				aria-valuenow={Math.round(ratio * 100)}
				className={cn(
					"relative h-[0.75rem] w-full overflow-clip rounded-[0.5rem]",
					isWarning ? "bg-state-error-subtle" : "bg-brand-primary",
				)}>
				<div
					className={cn(
						"absolute inset-y-0 left-0 rounded-[0.5rem]",
						isWarning ? "bg-state-error" : "bg-brand-secondary-strong",
					)}
					style={{ width: `${ratio * 100}%` }}
				/>
			</div>
			<p
				className={cn(
					"typo-display-s whitespace-nowrap font-display",
					isWarning ? "text-state-error" : "text-text-primary",
				)}>
				{time}
			</p>
		</div>
	);
}
