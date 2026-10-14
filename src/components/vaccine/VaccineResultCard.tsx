import { motion, useReducedMotion } from "motion/react";
import { useRef, useState } from "react";
import { RESULT_CARD_FRAME } from "@/components/common/resultCardStyle";
import {
	ANTIGEN_COLOR_CLASS,
	type AntigenLabel,
	BACTERIA_ABBR_CLASS,
	splitAntigenAbbr,
} from "@/components/vaccine/antigen";
import { useMeasuredValue } from "@/components/vaccine/useMeasuredValue";
import { antigenKey } from "@/data/rules";
import { cn } from "@/utils/cn";

const SIZE_CLASS = {
	default: {
		root: `${RESULT_CARD_FRAME.default} gap-5`,
		image: "w-50 rounded-2xl",
		info: "gap-4",
		names: "gap-1",
		brand: "typo-label-l",
		name: "typo-label-button",
		chips: "gap-2",
		chip: "rounded-xl border-2 px-3.5 py-1.5 typo-caption",
	},
	large: {
		root: `${RESULT_CARD_FRAME.large} gap-7`,
		image: "w-70 rounded-[22px]",
		info: "gap-5.5",
		names: "gap-1.5",
		brand: "typo-label-button",
		name: "typo-label-cta",
		chips: "gap-2.75",
		chip: "rounded-[17px] border-3 px-5 py-2 typo-label-l",
	},
} as const;

const MARQUEE_MIN_SECONDS = 6;
const MARQUEE_SECONDS_PER_CHAR = 0.35;

type MarqueeNameProps = {
	name: string;
	className: string;
};

function MarqueeName({ name, className }: MarqueeNameProps) {
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

type VaccineResultCardProps = {
	imageSrc: string;
	brand?: string;
	name: string;
	antigens: AntigenLabel[];
	size?: keyof typeof SIZE_CLASS;
	className?: string;
};

export default function VaccineResultCard({
	imageSrc,
	brand,
	name,
	antigens,
	size = "default",
	className,
}: VaccineResultCardProps) {
	const sizeClass = SIZE_CLASS[size];
	const [failedImageSrc, setFailedImageSrc] = useState<string>();
	const canShowImage = imageSrc !== "" && imageSrc !== failedImageSrc;

	return (
		<div
			className={cn(
				"flex shrink-0 items-center overflow-hidden border-border-default",
				"bg-background-surface shadow-md",
				sizeClass.root,
				className,
			)}>
			<div className={cn("h-full shrink-0 overflow-hidden", sizeClass.image)}>
				{canShowImage && (
					<img
						src={imageSrc}
						alt=""
						onError={() => setFailedImageSrc(imageSrc)}
						className="size-full object-contain"
					/>
				)}
			</div>
			<div className={cn("flex min-w-0 flex-1 flex-col justify-center", sizeClass.info)}>
				<div className={cn("flex flex-col break-words", sizeClass.names)}>
					{brand && <p className={cn("text-text-secondary", sizeClass.brand)}>{brand}</p>}
					<MarqueeName name={name} className={cn("text-text-primary", sizeClass.name)} />
				</div>
				<ul className={cn("flex flex-wrap items-center", sizeClass.chips)}>
					{antigens.map((antigen) => (
						<li
							key={antigenKey(antigen)}
							className={cn(
								"whitespace-nowrap border-antigen-outline text-center text-antigen-text",
								ANTIGEN_COLOR_CLASS[antigen.color],
								sizeClass.chip,
							)}>
							<span
								className={cn(
									antigen.pathogenType === "bacteria" && ["inline-block", BACTERIA_ABBR_CLASS],
								)}>
								{splitAntigenAbbr(antigen.abbr).join(" ")}
							</span>
							{antigen.subtype && ` (${antigen.subtype})`}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
