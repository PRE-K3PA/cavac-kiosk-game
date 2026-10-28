import { useTranslation } from "react-i18next";
import imgMemoryLogo from "@/assets/images/card/imgMemoryLogo.png";
import imgMemoryLogoEn from "@/assets/images/card/imgMemoryLogoEn.png";
import imgLogoEn from "@/assets/images/common/imgLogoEn.png";
import imgLogoKo from "@/assets/images/common/imgLogoKo.png";
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

// 사진 없는 자리표시 쌍의 앞면과 카드판 가운데 로고 칸. 뒷면 로고(CARD_LOGO)와 헷갈리지 않게
// 공용 로고를 씁니다
const COMMON_LOGO = {
	ko: imgLogoKo,
	en: imgLogoEn,
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
	const { columns, card, gap, hasCenterLogo } = CARD_BOARD_LAYOUT[useOrientation()][pairCount];

	const tiles = cards.map((gameCard, index) => (
		<MemoryCard
			key={gameCard.id}
			className={card}
			logo={CARD_LOGO[language]}
			label={t("cardLabel", { n: index + 1 })}
			state={CARD_STATE[gameCard.status]}
			productImage={gameCard.image ? getImageUrl(gameCard.image[language]) : COMMON_LOGO[language]}
			onClick={() => onCardClick(gameCard.id)}
		/>
	));

	if (hasCenterLogo) {
		tiles.splice(
			cards.length / 2,
			0,
			<div
				key="center-logo"
				data-testid="center-logo"
				aria-hidden="true"
				className={cn("flex items-center justify-center", card)}>
				<img src={COMMON_LOGO[language]} alt="" className="w-7/10 object-contain opacity-30" />
			</div>,
		);
	}

	return (
		<div className={cn("flex items-center justify-center", className)}>
			<div className={cn("grid", columns, gap)}>{tiles}</div>
		</div>
	);
}
