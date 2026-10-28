import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { useMeasuredValue } from "@/components/vaccine/useMeasuredValue";
import { cn } from "@/utils/cn";

const MARQUEE_MIN_SECONDS = 6;
const MARQUEE_SECONDS_PER_CHAR = 0.35;

type MarqueeNameProps = {
	name: string;
	className?: string;
};

/** 한 줄에 다 들어가지 않는 이름을 옆으로 흐르게 보여 준다. 움직임 줄이기 설정이면 줄을 바꾼다 */
export default function MarqueeName({ name, className }: MarqueeNameProps) {
	const shouldReduceMotion = useReducedMotion();
	const boxRef = useRef<HTMLParagraphElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const isOverflowing = useMeasuredValue(`${name}|${className}`, false, () =>
		boxRef.current && textRef.current
			? textRef.current.offsetWidth > boxRef.current.clientWidth
			: undefined,
	);
	const isMarquee = !shouldReduceMotion && isOverflowing;
	const seconds = Math.max(MARQUEE_MIN_SECONDS, [...name].length * MARQUEE_SECONDS_PER_CHAR);

	return (
		<p
			ref={boxRef}
			className={cn(
				shouldReduceMotion ? "break-keep" : "overflow-hidden whitespace-nowrap",
				className,
			)}>
			<motion.span
				className={cn(!shouldReduceMotion && "flex w-max")}
				animate={{ x: isMarquee ? ["0%", "-50%"] : 0 }}
				transition={
					isMarquee
						? { duration: seconds, ease: "linear", repeat: Number.POSITIVE_INFINITY }
						: { duration: 0 }
				}>
				<span className={cn(isMarquee && "pr-16")}>
					<span ref={textRef}>{name}</span>
				</span>
				{isMarquee && (
					<span aria-hidden="true" className="pr-16">
						{name}
					</span>
				)}
			</motion.span>
		</p>
	);
}
