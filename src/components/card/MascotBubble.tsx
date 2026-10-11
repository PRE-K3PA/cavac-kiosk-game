import { cva } from "class-variance-authority";
import bubbleColumnCountdown from "@/assets/images/card/bubble-column-countdown.svg";
import bubbleColumnMatched from "@/assets/images/card/bubble-column-matched.svg";
import bubbleRowCountdown from "@/assets/images/card/bubble-row-countdown.svg";
import bubbleRowMatched from "@/assets/images/card/bubble-row-matched.svg";
import dividerColumn from "@/assets/images/card/divider-column.svg";
import dividerRow from "@/assets/images/card/divider-row.svg";
import mascotImage from "@/assets/images/card/mascot.png";
import { cn } from "@/utils/cn";

type Direction = "column" | "row";

type CountdownProps = {
	type?: "countdown";
	title: string;
	message: string;
	count: number | string;
};

type MatchedProps = {
	type: "matched";
	count: number | string;
	label: string;
};

type MascotBubbleProps = (CountdownProps | MatchedProps) & {
	direction?: Direction;
	className?: string;
};

const bubbleShapes = {
	column: { countdown: bubbleColumnCountdown, matched: bubbleColumnMatched },
	row: { countdown: bubbleRowCountdown, matched: bubbleRowMatched },
} as const;

const shapeInsets = {
	column: {
		countdown: "inset-[-2.41%_-4.76%_-4.48%_-4.76%]",
		matched: "inset-[-2.79%_-4.76%_-5.19%_-4.76%]",
	},
	row: {
		countdown: "inset-[-3.5%_-2.93%_-6.5%_-2.93%]",
		matched: "inset-[-4.24%_-2.93%_-7.88%_-2.93%]",
	},
} as const;

const bubbleVariants = cva("relative flex shrink-0 items-center", {
	variants: {
		direction: { column: "w-105 flex-col", row: "mr-[-20px] w-167" },
		type: { countdown: "", matched: "" },
	},
	compoundVariants: [
		{ direction: "column", type: "countdown", class: "h-141 gap-6 pt-9.5" },
		{ direction: "column", type: "matched", class: "mb-[-20px] h-120.25 justify-center pb-5.25" },
		{ direction: "row", type: "countdown", class: "h-100 gap-8 pl-11" },
		{ direction: "row", type: "matched", class: "h-82.5 justify-center pr-9.5" },
	],
});

const shapeVariants = cva("absolute top-0 left-0", {
	variants: {
		direction: { column: "w-105", row: "w-170.5" },
		type: { countdown: "", matched: "" },
	},
	compoundVariants: [
		{ direction: "column", type: "countdown", class: "h-145" },
		{ direction: "column", type: "matched", class: "h-125.25" },
		{ direction: "row", type: "countdown", class: "h-100" },
		{ direction: "row", type: "matched", class: "h-82.5" },
	],
});

// -webkit-text-stroke 는 글자 경계 중앙에 그려지므로 Figma 외곽선 폭의 2배를 주고 fill 을 위에 칠한다.
const outlinedText =
	"[paint-order:stroke_fill] [stroke-linejoin:round] [-webkit-text-stroke-color:var(--color-text-primary)]";
const titleOutline = "[-webkit-text-stroke-width:12px]";
const countOutline = "[-webkit-text-stroke-width:28px]";
const matchedOutline = "[-webkit-text-stroke-width:16px]";

function CountdownContent({
	direction,
	title,
	message,
	count,
}: CountdownProps & { direction: Direction }) {
	const [firstLine, ...restLines] = title.split("\n");
	const isColumn = direction === "column";

	return (
		<>
			<div
				className={cn(
					"relative flex flex-col items-center text-center",
					isColumn ? "w-101" : "w-97",
				)}>
				<p
					className={cn(
						"font-display typo-display-m text-accent-sky-blue text-shadow-hard-sm",
						outlinedText,
						titleOutline,
					)}>
					{firstLine}
					{restLines.map((line) => (
						<span key={line} className="block text-accent-yellow">
							{line}
						</span>
					))}
				</p>
				<p className="typo-title-m whitespace-pre-line text-center text-text-primary">{message}</p>
			</div>
			{isColumn ? (
				<img alt="" src={dividerColumn} className="relative block h-[3px] w-80 max-w-none" />
			) : (
				<div className="relative flex h-55 w-0 items-center justify-center">
					<img alt="" src={dividerRow} className="block h-[3px] w-55 max-w-none -rotate-90" />
				</div>
			)}
			<p
				className={cn(
					"typo-number-xl relative w-22.5 text-center text-accent-yellow text-shadow-hard-md",
					outlinedText,
					countOutline,
				)}>
				{count}
			</p>
		</>
	);
}

function MatchedContent({ count, label }: MatchedProps) {
	return (
		<p
			className={cn(
				"relative font-display whitespace-pre-line text-center text-accent-sky-blue text-shadow-hard-sm",
				outlinedText,
				matchedOutline,
			)}>
			<span className="typo-display-xl leading-[1.15]! text-accent-yellow">{count}</span>
			<span className="typo-title-l leading-[1.15]!">{label}</span>
		</p>
	);
}

export function MascotBubble({ direction = "column", className, ...content }: MascotBubbleProps) {
	const type = content.type ?? "countdown";
	const isRow = direction === "row";

	return (
		<div className={cn("flex items-center", !isRow && "flex-col", className)}>
			<div className={bubbleVariants({ direction, type })}>
				<div className={shapeVariants({ direction, type })}>
					<div className={cn("absolute", shapeInsets[direction][type])}>
						<img
							alt=""
							src={bubbleShapes[direction][type]}
							className="block size-full max-w-none"
						/>
					</div>
				</div>
				{content.type === "matched" ? (
					<MatchedContent {...content} />
				) : (
					<CountdownContent direction={direction} {...content} />
				)}
			</div>
			<img
				alt=""
				src={mascotImage}
				className={cn("size-100 shrink-0 object-cover", isRow && "-scale-y-100 rotate-180")}
			/>
		</div>
	);
}
