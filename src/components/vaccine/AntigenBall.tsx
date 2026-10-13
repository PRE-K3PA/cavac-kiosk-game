import { motion, type TargetAndTransition, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import {
	ANTIGEN_COLOR_CLASS,
	type AntigenLabel,
	splitAntigenAbbr,
} from "@/components/vaccine/antigen";
import { useFontsLoadCount } from "@/components/vaccine/useFontsLoadCount";
import { cn } from "@/utils/cn";

const SIZE_CLASS = {
	default: {
		root: "size-41",
		ball: "inset-2.5 border-4",
		highlight: "top-5.5 left-9 h-7 w-11.5",
		text: "gap-0.5",
		subtype: "max-w-31 typo-label-m",
	},
	mini: {
		root: "size-12.5",
		ball: "inset-0.75 border-[1.5px]",
		highlight: "top-1.5 left-2.75 h-2 w-3.5",
		text: "gap-px",
		subtype: "max-w-9.5 text-[6px] leading-[1.3] font-semibold",
	},
} as const;

// 아래 글자 수치는 default(164px) 기준이고 mini 는 비율로 줄인다.
const SIZE_SCALE = {
	default: 1,
	mini: 50 / 164,
} as const;

const COMPACT_ABBR_LENGTH = 4;
const SINGLE_LINE_FONT_SIZE = 46;
const SINGLE_LINE_COMPACT_FONT_SIZE = 38;
const MIN_FONT_SIZE = 14;
const FONT_SIZE_STEP = 2;
const MAX_TEXT_HEIGHT = 112;

// 둥근 구슬이라 줄 위치마다 쓸 수 있는 폭이 다르다.
const LINE_WIDTHS_BY_COUNT = [[124], [116, 116], [100, 124, 100]] as const;
const LINE_WIDTHS_WITH_SUBTYPE = [112, 124] as const;

type AbbrLine = { key: string; text: string; width: number };

function getAbbrLines(abbr: string, hasSubtype: boolean): AbbrLine[] {
	const maxLines = hasSubtype ? 2 : 3;
	const parts = splitAntigenAbbr(abbr);
	const texts =
		parts.length <= maxLines
			? parts
			: [...parts.slice(0, maxLines - 1), parts.slice(maxLines - 1).join(" ")];
	const widths: readonly number[] =
		hasSubtype && texts.length === 2
			? LINE_WIDTHS_WITH_SUBTYPE
			: (LINE_WIDTHS_BY_COUNT[texts.length - 1] ?? LINE_WIDTHS_BY_COUNT[0]);

	return texts.map((text, position) => ({
		key: `${position}-${text}`,
		text,
		width: widths[position] ?? widths[0],
	}));
}

function getStartFontSize(lines: AbbrLine[], hasSubtype: boolean) {
	if (lines.length >= 3) return 28;
	if (lines.length === 2) return hasSubtype ? 28 : 32;
	const isCompact = (lines[0]?.text.length ?? 0) >= COMPACT_ABBR_LENGTH;
	return isCompact ? SINGLE_LINE_COMPACT_FONT_SIZE : SINGLE_LINE_FONT_SIZE;
}

function fitFontSize(textBox: HTMLElement, lineBox: HTMLElement, scale: number, start: number) {
	const lines = Array.from(lineBox.querySelectorAll("p"));
	const isOverflowing = () =>
		textBox.offsetHeight > MAX_TEXT_HEIGHT * scale ||
		lines.some((line) => line.scrollWidth > line.clientWidth);
	const apply = (fontSize: number) => {
		for (const line of lines) line.style.fontSize = `${fontSize}px`;
	};

	let fontSize = start;
	apply(fontSize);
	while (fontSize > MIN_FONT_SIZE * scale && isOverflowing()) {
		fontSize = Math.max(fontSize - FONT_SIZE_STEP * scale, MIN_FONT_SIZE * scale);
		apply(fontSize);
	}
	return fontSize;
}

const STATE_BALL_CLASS = {
	default: "border-antigen-outline shadow-antigen",
	selected: "border-antigen-outline shadow-antigen",
	hint: "border-antigen-outline shadow-glow-hint",
	correct: "border-antigen-outline shadow-glow-correct",
	wrong: "border-state-error opacity-60 shadow-antigen",
} as const;

type AntigenBallState = keyof typeof STATE_BALL_CLASS;

const VIEW_BOX = "0 0 164 164";

const RING_CLASS = {
	selected: "stroke-brand-primary",
	hint: "stroke-accent-yellow",
	correct: "stroke-state-success-strong",
	wrong: "stroke-state-error",
} as const;

const RING_DASH = {
	selected: "14 11",
	hint: "6 6",
	correct: undefined,
	wrong: undefined,
} as const;

const SPARKLE_LINES = [
	{ x1: -6, y1: 26, x2: 2, y2: 39.86 },
	{ x1: 176, y1: 44, x2: 168, y2: 55.47 },
	{ x1: 22, y1: 175, x2: 34, y2: 168 },
] as const;

const CHECK_PATH = "M112 8 L122 18 L138 -2";
const CROSS_PATH = "M28 28 L136 136 M136 28 L28 136";

const STATE_ANIMATION: Partial<Record<AntigenBallState, TargetAndTransition>> = {
	correct: { scale: [1, 1.12, 1], transition: { duration: 0.45, ease: "easeOut" } },
	wrong: { x: [0, -8, 8, -6, 6, 0], transition: { duration: 0.4, ease: "easeInOut" } },
};

const HINT_TWINKLE: TargetAndTransition = {
	opacity: [1, 0.35, 1],
	transition: { duration: 1.2, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY },
};

const MARK_DRAW: TargetAndTransition = {
	pathLength: [0, 1],
	transition: { duration: 0.3, ease: "easeOut" },
};

type AntigenBallProps = AntigenLabel & {
	state?: AntigenBallState;
	size?: keyof typeof SIZE_CLASS;
	className?: string;
};

export default function AntigenBall({
	abbr,
	subtype,
	color,
	state = "default",
	size,
	className,
}: AntigenBallProps) {
	const shouldReduceMotion = useReducedMotion();
	const resolvedSize = size ?? "default";
	const sizeClass = SIZE_CLASS[resolvedSize];
	const scale = SIZE_SCALE[resolvedSize];
	const hasSubtype = Boolean(subtype);
	const lines = getAbbrLines(abbr, hasSubtype);
	const startFontSize = getStartFontSize(lines, hasSubtype) * scale;

	// 글꼴이 늦게 로드되면 글자 폭이 바뀌므로 다시 맞춘다.
	const fitKey = `${abbr}|${subtype ?? ""}|${resolvedSize}|${useFontsLoadCount()}`;
	const [fitted, setFitted] = useState<{ key: string; fontSize: number }>();
	const fontSize = fitted?.key === fitKey ? fitted.fontSize : startFontSize;
	const textBoxRef = useRef<HTMLDivElement>(null);
	const lineBoxRef = useRef<HTMLDivElement>(null);

	useLayoutEffect(() => {
		if (!textBoxRef.current || !lineBoxRef.current) return;
		const fittedFontSize = fitFontSize(
			textBoxRef.current,
			lineBoxRef.current,
			scale,
			startFontSize,
		);
		setFitted({ key: fitKey, fontSize: fittedFontSize });
	}, [fitKey, scale, startFontSize]);
	const animate = (target: TargetAndTransition | undefined) =>
		shouldReduceMotion ? undefined : target;

	return (
		<motion.div
			key={state}
			data-state={state}
			animate={animate(STATE_ANIMATION[state])}
			className={cn("relative shrink-0", sizeClass.root, className)}>
			{state !== "default" && (
				<motion.svg
					aria-hidden="true"
					viewBox={VIEW_BOX}
					animate={animate(state === "hint" ? HINT_TWINKLE : undefined)}
					className="absolute inset-0 size-full overflow-visible fill-none">
					<circle
						cx="82"
						cy="82"
						r="80"
						strokeWidth="5"
						strokeDasharray={RING_DASH[state]}
						className={RING_CLASS[state]}
					/>
					{state === "hint" &&
						SPARKLE_LINES.map((line) => (
							<line
								key={`${line.x1}-${line.y1}`}
								{...line}
								strokeWidth="3"
								strokeLinecap="round"
								className="stroke-accent-yellow"
							/>
						))}
				</motion.svg>
			)}
			<div
				className={cn(
					"absolute rounded-full",
					sizeClass.ball,
					STATE_BALL_CLASS[state],
					ANTIGEN_COLOR_CLASS[color],
				)}
			/>
			<div
				className={cn(
					"absolute -rotate-28 rounded-full bg-background-surface/70",
					sizeClass.highlight,
				)}
			/>
			{state === "wrong" && (
				<StateMark path={CROSS_PATH} className="stroke-state-error" animate={animate(MARK_DRAW)} />
			)}
			<div className="absolute inset-0 flex items-center justify-center text-center text-antigen-text">
				<div ref={textBoxRef} className={cn("flex flex-col items-center", sizeClass.text)}>
					<div
						ref={lineBoxRef}
						role="img"
						aria-label={lines.map((line) => line.text).join(" ")}
						className="flex flex-col items-center">
						{lines.map((line) => (
							<p
								key={line.key}
								aria-hidden="true"
								className="overflow-hidden whitespace-nowrap font-bold leading-[1.1]"
								style={{ width: line.width * scale, fontSize }}>
								{line.text}
							</p>
						))}
					</div>
					{subtype && <p className={cn("truncate", sizeClass.subtype)}>{subtype}</p>}
				</div>
			</div>
			{state === "correct" && (
				<StateMark
					path={CHECK_PATH}
					className="stroke-state-success-strong"
					animate={animate(MARK_DRAW)}
				/>
			)}
		</motion.div>
	);
}

type StateMarkProps = {
	path: string;
	className: string;
	animate: TargetAndTransition | undefined;
};

function StateMark({ path, className, animate }: StateMarkProps) {
	return (
		<svg
			aria-hidden="true"
			viewBox={VIEW_BOX}
			className="absolute inset-0 size-full overflow-visible fill-none"
			strokeLinecap="round"
			strokeLinejoin="round">
			<motion.path
				d={path}
				strokeWidth="18"
				className="stroke-background-surface"
				animate={animate}
			/>
			<motion.path d={path} strokeWidth="10" className={className} animate={animate} />
		</svg>
	);
}
