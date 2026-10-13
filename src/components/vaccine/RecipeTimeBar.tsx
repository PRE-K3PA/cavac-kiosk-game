import { motion } from "motion/react";
import { useState } from "react";
import { toPercent } from "@/components/vaccine/percent";
import { cn } from "@/utils/cn";

const FALLBACK_SECONDS = 3;

type RecipeTimeBarProps = {
	/** 허용 범위 3~7초 (백신 1개=3초 ~ 5개=7초) */
	seconds: number;
	/** 100 으로 렌더한 뒤 0 으로 한 번 바꾸면 seconds 동안 줄어든다. 값이 커지면 즉시 반영. 매 프레임 갱신용이 아님 */
	progress: number;
	label?: string;
	className?: string;
};

export default function RecipeTimeBar({ seconds, progress, label, className }: RecipeTimeBarProps) {
	const clampedProgress = toPercent(progress);
	const duration = Number.isFinite(seconds) && seconds > 0 ? seconds : FALLBACK_SECONDS;
	const [previousProgress, setPreviousProgress] = useState(clampedProgress);
	const [isResetting, setIsResetting] = useState(false);
	const transitionSeconds = isResetting ? 0 : duration;

	if (clampedProgress !== previousProgress) {
		setPreviousProgress(clampedProgress);
		setIsResetting(clampedProgress > previousProgress);
	}

	return (
		<div
			role="progressbar"
			aria-label={label}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-valuenow={clampedProgress}
			className={cn(
				"relative h-7.5 w-302.5 overflow-hidden rounded-[10px] bg-background-surface-subtle",
				className,
			)}>
			<motion.div
				initial={false}
				animate={{ width: `${clampedProgress}%` }}
				transition={{ duration: transitionSeconds, ease: "linear" }}
				className="absolute inset-y-0 left-0 rounded-[10px] bg-brand-secondary"
			/>
		</div>
	);
}
