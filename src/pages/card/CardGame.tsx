import { useTranslation } from "react-i18next";
import MascotBubble from "@/components/card/MascotBubble";
import GameBackground from "@/components/common/GameBackground";
import PlayTimer from "@/components/common/PlayTimer";
import StatBox from "@/components/common/StatBox";
import { useCardGame } from "@/features/card-game/hooks/useCardGame";
import { useCardGameData } from "@/features/card-game/hooks/useCardGameData";
import { useCardGameSounds } from "@/features/card-game/hooks/useCardGameSounds";
import { useBgm } from "@/hooks/useBgm";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { useOrientation } from "@/layout/OrientationContext";
import ScreenLayout from "@/layout/ScreenLayout";
import CardBoard from "@/pages/card/CardBoard";
import CardResult from "@/pages/card/CardResult";
import { CARD_BOARD_AREA } from "@/pages/card/cardBoardLayout";
import type { CardGameData, CommonData } from "@/types/data";
import { BGM_NAMES } from "@/utils/soundEngine";

export type CardGameProps = {
	onExit: () => void;
	onAdminActivate: () => void;
};

// 안내(06)와 게임(07)의 패널 좌표는 Figma 그대로입니다. 카드판 영역은 둘이 같습니다
const LAYOUT = {
	landscape: {
		timer: "absolute top-9.5 left-12 w-456",
		previewPanel: "absolute inset-y-0 left-12.5 flex w-105 flex-col items-start justify-center",
		playPanel: "absolute top-18.5 left-12.5 flex w-105 flex-col items-start gap-6",
		matchedBubble: "",
		bubbleDirection: "column",
	},
	portrait: {
		timer: "absolute top-9.5 left-12 w-246",
		previewPanel: "absolute top-11 left-8 flex h-124 w-246 items-center",
		playPanel: "absolute top-21 left-12 h-124 w-246",
		matchedBubble: "absolute top-24 left-0",
		bubbleDirection: "row",
	},
} as const;

// MascotBubble 의 count 는 숫자나 문자열만 받으므로, 줄 높이를 지키는 공백 문자(U+00A0)로 숫자를 숨깁니다
const HIDDEN_COUNT = String.fromCharCode(0xa0);

type CardGameSessionProps = CardGameProps & {
	data: CardGameData;
	playDurationSeconds: number;
	autoReset: CommonData["autoReset"];
};

function CardGameSession({
	data,
	playDurationSeconds,
	autoReset,
	onExit,
	onAdminActivate,
}: CardGameSessionProps) {
	const { t } = useTranslation("cardGame");
	const game = useCardGame(data, playDurationSeconds);
	useCardGameSounds(game);
	// 홈으로 나가면 이 컴포넌트가 사라지면서 판의 진행 상태도 함께 버려집니다
	useIdleTimeout({ ...autoReset, onTimeout: onExit });
	// 결과 화면도 이 컴포넌트가 그리므로 배경음이 끊기지 않습니다
	useBgm(BGM_NAMES.cardGame);
	const orientation = useOrientation();
	const layout = LAYOUT[orientation];

	if (game.phase === "finished") {
		return (
			<CardResult
				score={game.score}
				products={game.resultProducts}
				onExit={onExit}
				onAdminActivate={onAdminActivate}
			/>
		);
	}

	// 뒤집히는 동안(flipping)에는 안내 패널을 그대로 두고 숫자만 숨겨 레이아웃이 튀지 않게 합니다
	const isBriefing = game.phase === "preview" || game.phase === "flipping";

	return (
		<ScreenLayout onAdminActivate={onAdminActivate} background={<GameBackground />}>
			{!isBriefing && (
				<PlayTimer
					className={layout.timer}
					time={t("time", { seconds: Math.ceil(game.remainingSeconds) })}
					progress={game.progress}
				/>
			)}
			{isBriefing ? (
				<div className={layout.previewPanel}>
					<MascotBubble
						direction={layout.bubbleDirection}
						title={t("memorize.title")}
						message={t("memorize.message")}
						count={game.phase === "flipping" ? HIDDEN_COUNT : game.countdown}
					/>
				</div>
			) : (
				<div className={layout.playPanel}>
					<StatBox tone="surface" label={t("score")} value={game.score.toLocaleString("en-US")} />
					<MascotBubble
						type="matched"
						className={layout.matchedBubble}
						direction={layout.bubbleDirection}
						count={game.matchedPairs}
						label={t("matchedLabel")}
					/>
				</div>
			)}
			<CardBoard
				className={CARD_BOARD_AREA[orientation]}
				cards={game.cards}
				pairCount={data.settings.pairCount}
				onCardClick={game.onCardClick}
			/>
		</ScreenLayout>
	);
}

export default function CardGame({ onExit, onAdminActivate }: CardGameProps) {
	const source = useCardGameData();
	if (!source)
		return (
			<ScreenLayout onAdminActivate={onAdminActivate} background={<GameBackground />}>
				{null}
			</ScreenLayout>
		);

	return (
		<CardGameSession
			data={source.cardGame}
			playDurationSeconds={source.playDurationSeconds}
			autoReset={source.autoReset}
			onExit={onExit}
			onAdminActivate={onAdminActivate}
		/>
	);
}
