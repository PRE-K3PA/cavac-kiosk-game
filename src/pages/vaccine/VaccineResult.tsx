import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import GameBackground from "@/components/common/GameBackground";
import HomeButton from "@/components/common/HomeButton";
import ResultCarousel from "@/components/common/ResultCarousel";
import VaccineResultCard from "@/components/vaccine/VaccineResultCard";
import { getImageUrl } from "@/data/storage";
import type { AntigenColors } from "@/features/vaccine-game/utils/antigenColors";
import type { GameResult } from "@/features/vaccine-game/utils/game";
import { useOrientation } from "@/layout/OrientationContext";
import ScreenLayout from "@/layout/ScreenLayout";
import { toAntigenLabel } from "@/pages/vaccine/antigenLabel";
import { useTweenedNumber } from "@/pages/vaccine/useTweenedNumber";
import { formatScore, VACCINE_GAME_COPY } from "@/pages/vaccine/vaccineGameContent";
import type { Language } from "@/types/data";
import { cn } from "@/utils/cn";

// Figma 에 없어 이번에 정했다
const SCORE_COUNT_SECONDS = 1.2;

// 점수 모양은 카드 결과(CardResult)와 같습니다.
// bg-clip-text 글자에는 text-stroke 가 안쪽으로 걸쳐 그라데이션을 가리므로, 같은 글자를 뒤에 한 겹 더 깔아 그립니다
const SCORE_GRADIENT =
	"bg-linear-to-b from-accent-yellow to-accent-amber bg-clip-text text-transparent";
const SCORE_BACKDROP = cn(
	"absolute inset-0 whitespace-nowrap",
	"text-text-primary text-shadow-hard-lg outlined-text [--text-outline-width:20px]",
);

const LAYOUT = {
	landscape: {
		main: "gap-6",
		carouselGap: "mt-4 mb-6",
		cardSize: "default",
		homeButton: "h-28 w-120",
	},
	portrait: {
		main: "gap-8",
		carouselGap: "my-6",
		cardSize: "large",
		homeButton: undefined,
	},
} as const;

type VaccineResultProps = {
	result: GameResult;
	colors: AntigenColors;
	language: Language;
	onHome: () => void;
	onAdminActivate: () => void;
};

export default function VaccineResult({
	result,
	colors,
	language,
	onHome,
	onAdminActivate,
}: VaccineResultProps) {
	const orientation = useOrientation();
	const layout = LAYOUT[orientation];
	const [slideIndex, setSlideIndex] = useState(0);
	const copy = VACCINE_GAME_COPY;
	const shouldReduceMotion = useReducedMotion();
	const shownScore = useTweenedNumber(result.score, SCORE_COUNT_SECONDS, 0);
	const scoreText = formatScore(Math.round(shownScore));

	const slides = result.vaccines.map((vaccine) => ({
		id: vaccine.id,
		content: (
			<VaccineResultCard
				imageSrc={getImageUrl(vaccine.bottleImage[language])}
				brand={vaccine.brandName[language]}
				name={vaccine.productName[language]}
				antigens={vaccine.antigens.map((antigen) => toAntigenLabel(antigen, colors))}
				size={layout.cardSize}
			/>
		),
	}));

	const carouselProps =
		orientation === "landscape"
			? ({
					size: "compact",
					arrowLabels: { prev: copy.previousVaccine[language], next: copy.nextVaccine[language] },
				} as const)
			: ({ size: "large" } as const);

	return (
		<ScreenLayout
			onAdminActivate={onAdminActivate}
			background={<GameBackground />}
			className={cn("items-center justify-center", layout.main)}>
			<motion.h1
				initial={shouldReduceMotion ? false : { y: -40, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ type: "spring", stiffness: 300, damping: 18 }}
				className="typo-display-m font-display text-text-primary">
				{result.isAllWrong ? copy.resultEncourage[language] : copy.resultTitle[language]}
			</motion.h1>
			<motion.p
				initial={shouldReduceMotion ? false : { scale: 0.3, opacity: 0 }}
				animate={{ scale: 1, opacity: 1 }}
				transition={{ type: "spring", stiffness: 260, damping: 12, delay: 0.15 }}
				className="typo-display-l relative whitespace-nowrap font-display">
				<span aria-hidden="true" className={SCORE_BACKDROP}>
					{scoreText}
					{copy.scoreUnit[language]}
				</span>
				<span className="relative">
					<span className={SCORE_GRADIENT}>{scoreText}</span>
					<span className="text-accent-sky-blue">{copy.scoreUnit[language]}</span>
				</span>
			</motion.p>
			<p className="typo-title-m text-text-secondary">{copy.resultSubtitle[language]}</p>

			<motion.div
				initial={shouldReduceMotion ? false : { y: 60, opacity: 0 }}
				animate={{ y: 0, opacity: 1 }}
				transition={{ type: "spring", stiffness: 220, damping: 20, delay: 0.35 }}>
				<ResultCarousel
					label={copy.carouselLabel[language]}
					slides={slides}
					index={slideIndex}
					onIndexChange={setSlideIndex}
					autoAdvance
					className={layout.carouselGap}
					{...carouselProps}
				/>
			</motion.div>

			<HomeButton label={copy.home[language]} onClick={onHome} className={layout.homeButton} />
		</ScreenLayout>
	);
}
