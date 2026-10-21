import { motion, useReducedMotion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import RecipeCard from "@/components/vaccine/RecipeCard";
import RecipeTimeBar from "@/components/vaccine/RecipeTimeBar";
import type { AntigenColors } from "@/features/vaccine-game/antigenColors";
import { getRecipeSeconds } from "@/features/vaccine-game/round";
import { useOrientation } from "@/layout/OrientationContext";
import ScreenLayout from "@/layout/ScreenLayout";
import { toAntigenLabel } from "@/pages/vaccine/antigenLabel";
import VaccineBackground from "@/pages/vaccine/VaccineBackground";
import { VACCINE_GAME_COPY } from "@/pages/vaccine/vaccineGameContent";
import type { Language, Vaccine } from "@/types/data";
import { cn } from "@/utils/cn";

const RECIPE_TONES = ["01", "02", "03", "04", "05"] as const;

const LAYOUT = {
	landscape: {
		main: "gap-17.5 p-16",
		title: "w-400 pb-12.5",
		grid: "w-448 flex-row flex-wrap justify-center gap-8",
		card: undefined,
		countdown: "w-318.5",
		timeBar: undefined,
	},
	portrait: {
		main: "gap-12 px-16 py-24",
		title: "w-238",
		grid: "flex-col gap-8",
		card: "w-238",
		countdown: "w-238",
		timeBar: "h-3.5 w-238",
	},
} as const;

/** 백신이 4~5개면 카드가 화면을 넘으므로 남은 공간에 맞게 카드 묶음을 줄인다 */
function useFitScale() {
	const areaRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);
	const [scale, setScale] = useState(1);

	useLayoutEffect(() => {
		const area = areaRef.current;
		const content = contentRef.current;
		if (!area || !content) return;
		setScale(
			Math.min(1, area.clientWidth / content.offsetWidth, area.clientHeight / content.offsetHeight),
		);
	}, []);

	return { areaRef, contentRef, scale };
}

type VaccineRecipeProps = {
	vaccines: Vaccine[];
	colors: AntigenColors;
	language: Language;
	onDone: () => void;
	onAdminActivate: () => void;
};

export default function VaccineRecipe({
	vaccines,
	colors,
	language,
	onDone,
	onAdminActivate,
}: VaccineRecipeProps) {
	const seconds = getRecipeSeconds(vaccines.length);
	const [remainingSeconds, setRemainingSeconds] = useState(seconds);
	const [barProgress, setBarProgress] = useState(100);
	const layout = LAYOUT[useOrientation()];
	const { areaRef, contentRef, scale } = useFitScale();
	const shouldReduceMotion = useReducedMotion();

	useEffect(() => {
		const frameId = requestAnimationFrame(() => setBarProgress(0));
		return () => cancelAnimationFrame(frameId);
	}, []);

	useEffect(() => {
		if (remainingSeconds <= 0) {
			onDone();
			return;
		}
		const timerId = setTimeout(() => setRemainingSeconds(remainingSeconds - 1), 1000);
		return () => clearTimeout(timerId);
	}, [remainingSeconds, onDone]);

	return (
		<ScreenLayout
			onAdminActivate={onAdminActivate}
			background={<VaccineBackground />}
			className={cn("items-center justify-center", layout.main)}>
			<h1
				className={cn(
					"typo-display-l shrink-0 break-keep text-center font-display text-text-primary",
					layout.title,
				)}>
				{VACCINE_GAME_COPY.recipeTitle[language]}
			</h1>

			<div ref={areaRef} className="flex min-h-0 w-full flex-1 items-center justify-center">
				<div
					ref={contentRef}
					className={cn("flex shrink-0 items-start", layout.grid)}
					style={{ transform: `scale(${scale})` }}>
					{vaccines.map((vaccine, index) => (
						<motion.div
							key={vaccine.id}
							initial={shouldReduceMotion ? false : { y: 80, scale: 0.85, opacity: 0 }}
							animate={{ y: 0, scale: 1, opacity: 1 }}
							transition={{ type: "spring", stiffness: 260, damping: 18, delay: index * 0.12 }}>
							<RecipeCard
								name={vaccine.productName[language]}
								tone={RECIPE_TONES[index % RECIPE_TONES.length]}
								antigens={vaccine.antigens.map((antigen) => toAntigenLabel(antigen, colors))}
								className={layout.card}
							/>
						</motion.div>
					))}
				</div>
			</div>

			<div className={cn("flex shrink-0 flex-col items-center gap-3 px-8", layout.countdown)}>
				<p className="typo-body-l text-center text-text-primary">
					{VACCINE_GAME_COPY.countdownBefore[language]}
					<motion.span
						key={remainingSeconds}
						initial={shouldReduceMotion ? false : { scale: 1.6 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 500, damping: 14 }}
						className="typo-number-l inline-block text-state-error">
						{remainingSeconds}
					</motion.span>
					{VACCINE_GAME_COPY.countdownAfter[language]}
				</p>
				<RecipeTimeBar
					seconds={seconds}
					progress={barProgress}
					label={VACCINE_GAME_COPY.countdownLabel[language]}
					className={layout.timeBar}
				/>
			</div>
		</ScreenLayout>
	);
}
