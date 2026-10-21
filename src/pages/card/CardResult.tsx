import { useState } from "react";
import { useTranslation } from "react-i18next";
import ProductResultCard from "@/components/card/ProductResultCard";
import GameBackground from "@/components/common/GameBackground";
import HomeButton from "@/components/common/HomeButton";
import ResultCarousel from "@/components/common/ResultCarousel";
import { getImageUrl } from "@/data/storage";
import { useOrientation } from "@/layout/OrientationContext";
import ScreenLayout from "@/layout/ScreenLayout";
import { useSessionStore } from "@/store/sessionStore";
import type { ImagePath, Localized } from "@/types/data";
import { cn } from "@/utils/cn";

type CardResultProps = {
	score: number;
	products: Localized<ImagePath>[];
	onExit: () => void;
	onAdminActivate: () => void;
};

const LAYOUT = {
	landscape: { main: "gap-4 p-8", home: "h-28 w-120" },
	portrait: { main: "gap-6 py-12", home: "" },
} as const;

const SCORE_GRADIENT =
	"bg-linear-to-b from-accent-yellow to-accent-amber bg-clip-text text-transparent";
// bg-clip-text 글자에는 text-stroke 가 안쪽으로 걸쳐 그라데이션을 가리므로,
// 외곽선과 그림자는 같은 글자를 뒤에 한 겹 더 깔아서 그립니다. Figma 외곽선은 약 10px 입니다
const SCORE_BACKDROP =
	"absolute inset-0 whitespace-nowrap text-text-primary text-shadow-hard-lg outlined-text [--text-outline-width:20px]";

export default function CardResult({ score, products, onExit, onAdminActivate }: CardResultProps) {
	const { t } = useTranslation("cardGame", { keyPrefix: "result" });
	const language = useSessionStore((s) => s.language);
	const orientation = useOrientation();
	const [index, setIndex] = useState(0);
	const layout = LAYOUT[orientation];
	const scoreText = score.toLocaleString("en-US");
	const isLandscape = orientation === "landscape";

	const slides = products.map((image, order) => {
		const src = getImageUrl(image[language]);
		return {
			id: `${order}:${src}`,
			content: <ProductResultCard size={isLandscape ? "default" : "large"} image={src} />,
		};
	});
	const carouselProps = {
		label: t("carouselLabel"),
		slides,
		index,
		onIndexChange: setIndex,
	};

	return (
		<ScreenLayout onAdminActivate={onAdminActivate} background={<GameBackground />}>
			<main className={cn("flex size-full flex-col items-center justify-center", layout.main)}>
				<div className="flex flex-col items-center text-center">
					<h1 className="typo-display-m font-display text-text-primary">{t("title")}</h1>
					<p className="typo-display-l relative whitespace-nowrap font-display">
						<span aria-hidden="true" className={SCORE_BACKDROP}>
							{scoreText}
							{t("unit")}
						</span>
						<span className="relative">
							<span className={SCORE_GRADIENT}>{scoreText}</span>
							<span className="text-accent-sky-blue">{t("unit")}</span>
						</span>
					</p>
					<p className="typo-title-m text-text-secondary">{t("subtitle")}</p>
				</div>
				{isLandscape ? (
					<ResultCarousel
						{...carouselProps}
						size="compact"
						arrowLabels={{ prev: t("prev"), next: t("next") }}
					/>
				) : (
					<ResultCarousel {...carouselProps} size="large" />
				)}
				<HomeButton label={t("home")} className={layout.home} onClick={onExit} />
			</main>
		</ScreenLayout>
	);
}
