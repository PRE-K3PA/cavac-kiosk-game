import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import {
	ANTIGEN_COLOR_CLASS,
	type AntigenLabel,
	getAntigenKey,
	splitAntigenAbbr,
} from "@/components/vaccine/antigen";
import { useFontsLoadCount } from "@/components/vaccine/useFontsLoadCount";
import { cn } from "@/utils/cn";

const SIZE_CLASS = {
	default: {
		root: "h-105 w-150 gap-5 rounded-3xl border-4 p-6",
		image: "w-50 rounded-2xl",
		info: "gap-4",
		names: "gap-1",
		brand: "typo-label-l",
		name: "typo-label-button",
		chips: "gap-2",
		chip: "rounded-xl border-2 px-3.5 py-1.5 typo-caption",
	},
	large: {
		root: "h-147 w-210 gap-7 rounded-[34px] border-6 p-8.5",
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

function getChipLabel({ abbr, subtype }: AntigenLabel) {
	const abbrText = splitAntigenAbbr(abbr).join(" ");
	return subtype ? `${abbrText} (${subtype})` : abbrText;
}

type MarqueeNameProps = {
	name: string;
	className: string;
};

function MarqueeName({ name, className }: MarqueeNameProps) {
	const shouldReduceMotion = useReducedMotion();
	// 글꼴이 늦게 로드되면 글자 폭이 바뀌므로 다시 잰다.
	const measureKey = `${name}|${className}|${useFontsLoadCount()}`;
	const [measured, setMeasured] = useState<{ key: string; isOverflowing: boolean }>();
	const boxRef = useRef<HTMLParagraphElement>(null);
	const textRef = useRef<HTMLSpanElement>(null);
	const isMarquee = !shouldReduceMotion && measured?.key === measureKey && measured.isOverflowing;
	const seconds = Math.max(MARQUEE_MIN_SECONDS, [...name].length * MARQUEE_SECONDS_PER_CHAR);

	useLayoutEffect(() => {
		if (!boxRef.current || !textRef.current) return;
		setMeasured({
			key: measureKey,
			isOverflowing: textRef.current.offsetWidth > boxRef.current.clientWidth,
		});
	}, [measureKey]);

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
							key={getAntigenKey(antigen)}
							className={cn(
								"whitespace-nowrap border-antigen-outline text-center text-antigen-text",
								ANTIGEN_COLOR_CLASS[antigen.color],
								sizeClass.chip,
							)}>
							{getChipLabel(antigen)}
						</li>
					))}
				</ul>
			</div>
		</div>
	);
}
