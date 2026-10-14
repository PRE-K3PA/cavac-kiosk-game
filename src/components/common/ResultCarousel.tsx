import { motion } from "motion/react";
import type { ComponentProps, PointerEvent, ReactNode } from "react";
import { useRef } from "react";
import CarouselArrow from "@/components/common/CarouselArrow";
import CarouselDot from "@/components/common/CarouselDot";
import { RESULT_CARD_SIZE } from "@/components/common/resultCardStyle";
import { cn } from "@/utils/cn";

const SWIPE_THRESHOLD = 80;

const SIZE = {
	compact: {
		root: "w-464 gap-5",
		stage: "h-105 w-422",
		slot: `-ml-75 -mt-52.5 ${RESULT_CARD_SIZE.default}`,
		offset: 582,
		sideScale: 524 / 600,
	},
	large: {
		root: "w-591",
		stage: "h-147 w-591",
		slot: `-ml-105 -mt-73.5 ${RESULT_CARD_SIZE.large}`,
		offset: 815,
		sideScale: 734 / 840,
	},
} as const;

type Slide = {
	id: string;
	content: ReactNode;
};

type ResultCarouselProps = Omit<ComponentProps<"div">, "children" | "aria-label"> & {
	label: string;
	slides: Slide[];
	index: number;
	onIndexChange: (index: number) => void;
} & (
		| { size?: "compact"; arrowLabels: { prev: string; next: string } }
		| { size: "large"; arrowLabels?: never }
	);

function wrappedDistance(slideIndex: number, current: number, count: number) {
	const d = (((slideIndex - current) % count) + count) % count;
	return d > count / 2 ? d - count : d;
}

export default function ResultCarousel({
	label,
	slides,
	index,
	onIndexChange,
	size = "compact",
	arrowLabels,
	className,
	...props
}: ResultCarouselProps) {
	const swipeStartX = useRef<number | null>(null);
	const count = slides.length;
	if (count === 0) return null;

	const { root, stage, slot, offset, sideScale } = SIZE[size];
	const current = ((index % count) + count) % count;
	const canMove = count > 1;
	const move = (step: number) => onIndexChange((current + step + count) % count);

	const handlePointerDown = (event: PointerEvent) => {
		swipeStartX.current = event.clientX;
	};
	const handlePointerUp = (event: PointerEvent) => {
		const startX = swipeStartX.current;
		swipeStartX.current = null;
		if (!canMove || startX === null) return;
		const dx = event.clientX - startX;
		if (Math.abs(dx) >= SWIPE_THRESHOLD) move(dx < 0 ? 1 : -1);
	};

	return (
		<section
			aria-roledescription="carousel"
			aria-label={label}
			className={cn("flex flex-col items-center gap-6", root, className)}
			{...props}>
			<div className={cn("flex items-center", size === "compact" && "gap-5")}>
				{size === "compact" && arrowLabels && (
					<CarouselArrow
						label={arrowLabels.prev}
						direction="prev"
						disabled={!canMove}
						onClick={() => move(-1)}
					/>
				)}
				<div
					className={cn("relative touch-pan-y overflow-clip", stage)}
					onPointerDown={handlePointerDown}
					onPointerUp={handlePointerUp}
					onPointerCancel={() => {
						swipeStartX.current = null;
					}}>
					{slides.map((slide, i) => {
						const d = wrappedDistance(i, current, count);
						const isCenter = d === 0;
						const position = Math.max(-2, Math.min(2, d));
						const isVisible = Math.abs(d) <= 1;
						return (
							<motion.div
								key={slide.id}
								aria-hidden={!isCenter}
								initial={false}
								animate={{
									x: position * offset,
									scale: isCenter ? 1 : sideScale,
									opacity: isCenter ? 1 : isVisible ? 0.85 : 0,
								}}
								transition={{ duration: 0.3, ease: "easeInOut" }}
								className={cn(
									"absolute top-1/2 left-1/2 flex items-center justify-center",
									slot,
									isCenter ? "z-10" : "pointer-events-none",
								)}>
								{slide.content}
							</motion.div>
						);
					})}
				</div>
				{size === "compact" && arrowLabels && (
					<CarouselArrow
						label={arrowLabels.next}
						direction="next"
						disabled={!canMove}
						onClick={() => move(1)}
					/>
				)}
			</div>
			{canMove && (
				<div className="flex items-center gap-4">
					{slides.map((slide, i) => (
						<CarouselDot key={slide.id} active={i === current} />
					))}
				</div>
			)}
		</section>
	);
}
