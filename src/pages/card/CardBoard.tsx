import { useTranslation } from "react-i18next";
import imgMemoryLogo from "@/assets/images/card/imgMemoryLogo.png";
import imgMemoryLogoEn from "@/assets/images/card/imgMemoryLogoEn.png";
import MemoryCard from "@/components/card/MemoryCard";
import { getImageUrl } from "@/data/storage";
import type { CardStatus, GameCard } from "@/features/card-game/utils/cardRules";
import { useOrientation } from "@/layout/OrientationContext";
import { CARD_BOARD_LAYOUT } from "@/pages/card/cardBoardLayout";
import { useSessionStore } from "@/store/sessionStore";
import type { Localized, PairCount } from "@/types/data";
import { cn } from "@/utils/cn";

const CARD_LOGO = {
	ko: imgMemoryLogo,
	en: imgMemoryLogoEn,
} satisfies Localized<string>;

const CARD_STATE = {
	hidden: "back",
	revealed: "front",
	wrong: "wrong",
	matched: "matched",
} as const satisfies Record<CardStatus, string>;

type CardBoardProps = {
	cards: GameCard[];
	pairCount: PairCount;
	onCardClick: (cardId: string) => void;
	className?: string;
};

export default function CardBoard({ cards, pairCount, onCardClick, className }: CardBoardProps) {
	const { t } = useTranslation("cardGame");
	const language = useSessionStore((s) => s.language);
	const { columns, card, gap } = CARD_BOARD_LAYOUT[useOrientation()][pairCount];

	return (
		<div className={cn("flex items-center justify-center", className)}>
			<div className={cn("grid", columns, gap)}>
				{cards.map((gameCard, index) => (
					<MemoryCard
						key={gameCard.id}
						className={card}
						logo={CARD_LOGO[language]}
						label={t("cardLabel", { n: index + 1 })}
						state={CARD_STATE[gameCard.status]}
						productImage={gameCard.image ? getImageUrl(gameCard.image[language]) : undefined}
						onClick={() => onCardClick(gameCard.id)}
					/>
				))}
			</div>
		</div>
	);
}
