import { motion, useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import GameBackground from "@/components/common/GameBackground";
import PlayTimer from "@/components/common/PlayTimer";
import StatBox from "@/components/common/StatBox";
import AntigenBall from "@/components/vaccine/AntigenBall";
import type { AntigenLabel } from "@/components/vaccine/antigen";
import VaccineBottle from "@/components/vaccine/VaccineBottle";
import { antigenKey, formatAntigenLabel } from "@/data/rules";
import { getImageUrl } from "@/data/storage";
import { useVaccinePlay } from "@/features/vaccine-game/hooks/useVaccinePlay";
import type { AntigenColors } from "@/features/vaccine-game/utils/antigenColors";
import {
	COMBO_START,
	type GameResult,
	getBottleFill,
	getCurrentVaccine,
	getNeededAntigens,
	getRemainingMs,
	isHintActive,
} from "@/features/vaccine-game/utils/game";
import { CORRECT_VISIBLE_MS, isBottleFull } from "@/features/vaccine-game/utils/play";
import type { FallingAntigen } from "@/features/vaccine-game/utils/spawn";
import { useOrientation } from "@/layout/OrientationContext";
import ScreenLayout from "@/layout/ScreenLayout";
import { toAntigenLabel } from "@/pages/vaccine/antigenLabel";
import { useTweenedNumber } from "@/pages/vaccine/useTweenedNumber";
import {
	formatCombo,
	formatCount,
	formatMissingAntigen,
	formatScore,
	formatSeconds,
	VACCINE_GAME_COPY,
} from "@/pages/vaccine/vaccineGameContent";
import type { Language, Vaccine, VaccineGameSettings } from "@/types/data";
import { cn } from "@/utils/cn";

// AntigenBall 은 164px 하나뿐이라 Figma 크기(목록 140·132, 낙하 176)는 비율로 줄이고 늘린다
const ANTIGEN_BALL_SIZE = 164;
const FALLING_BALL_SIZE = 176;
const HALF_BALL = FALLING_BALL_SIZE / 2;
// PlayTimer 의 경고 기준(남은 시간 1/6)과 같게 화면 가장자리도 깜박인다
const WARNING_RATIO = 1 / 6;
const BOTTLE_FILL_SECONDS = 0.5;

const PANEL =
	"absolute rounded-[30px] border-3 border-border-default bg-background-surface shadow-md";
const ERROR_EDGE = "shadow-[inset_0_0_160px_32px_var(--color-state-error)]";

const LAYOUT = {
	landscape: {
		timer: "left-12 top-9.5 w-456",
		rail: "left-12 top-34 h-228.5 w-85 flex-col items-center justify-between py-6",
		stats: "contents",
		bottle: undefined,
		field: "left-102.5 top-34 h-228.5 w-365.5",
		antigenList: "top-0 left-0 h-full w-49 flex-col items-center gap-7 pt-12",
		listBallSize: 140,
		falling: "top-0 left-51.5 h-228.5 w-314",
		feedback: "top-3.5 left-173.5",
		combo: "top-40 left-262",
		fallingField: { width: 1256, height: 914, ballSize: FALLING_BALL_SIZE },
		// 화면 기준 좌표. 낙하 영역의 왼쪽 위, 정답 구슬이 날아갈 병의 가운데
		fallingOrigin: { x: 616, y: 136 },
		bottleCenter: { x: 218, y: 688 },
	},
	portrait: {
		timer: "left-12 top-9.5 w-246",
		rail: "left-12 top-34 h-80 w-246 flex-row items-center justify-between pr-22 pl-5",
		stats: "flex flex-col gap-6",
		bottle: "h-56.75 w-33.5",
		field: "left-12 top-119 h-349 w-246",
		antigenList: "top-0 left-0 h-45 w-full flex-row items-center justify-center gap-17.25",
		listBallSize: 132,
		falling: "top-47 left-0 h-302 w-246",
		feedback: "top-50 left-88",
		combo: "top-200 left-135",
		fallingField: { width: 984, height: 1208, ballSize: FALLING_BALL_SIZE },
		fallingOrigin: { x: 48, y: 664 },
		bottleCenter: { x: 874, y: 296 },
	},
} as const;

type BallState = "default" | "hint" | "correct" | "wrong";

type SizedAntigenBallProps = {
	label: AntigenLabel;
	size: number;
	state?: BallState;
	className?: string;
};

function SizedAntigenBall({ label, size, state, className }: SizedAntigenBallProps) {
	return (
		<div className={cn("relative shrink-0", className)} style={{ width: size, height: size }}>
			<div
				className="absolute top-0 left-0 origin-top-left"
				style={{ transform: `scale(${size / ANTIGEN_BALL_SIZE})` }}>
				<AntigenBall {...label} state={state} />
			</div>
		</div>
	);
}

/** 떨어지는 동안 좌우로 살짝 흔들리게 한다. 판정한 구슬은 흔들지 않는다 */
function getSway(item: FallingAntigen, shouldReduceMotion: boolean | null): number {
	if (shouldReduceMotion || item.judgement) return 0;
	return Math.sin((item.y + item.id * 97) / 70) * 12;
}

type VaccinePlayProps = {
	round: Vaccine[];
	allVaccines: Vaccine[];
	settings: VaccineGameSettings;
	playDurationSeconds: number;
	colors: AntigenColors;
	language: Language;
	onFinish: (result: GameResult) => void;
	onAdminActivate: () => void;
};

export default function VaccinePlay({
	round,
	allVaccines,
	settings,
	playDurationSeconds,
	colors,
	language,
	onFinish,
	onAdminActivate,
}: VaccinePlayProps) {
	const layout = LAYOUT[useOrientation()];
	const shouldReduceMotion = useReducedMotion();
	const [random] = useState(() => Math.random);
	const { play, tap } = useVaccinePlay({
		round,
		allVaccines,
		settings,
		playDurationSeconds,
		field: layout.fallingField,
		random,
		onFinish,
	});
	const { game, lastTap } = play;

	const [screenScope, animateScreen] = useAnimate<HTMLDivElement>();
	const [flashScope, animateFlash] = useAnimate<HTMLDivElement>();
	const [bottleScope, animateBottle] = useAnimate<HTMLDivElement>();

	const vaccine = getCurrentVaccine(game);
	const remainingMs = getRemainingMs(game);
	const isWarning = remainingMs / game.durationMs <= WARNING_RATIO;
	const neededKeys = new Set(getNeededAntigens(game).map(antigenKey));
	const isHinting = isHintActive(game);
	const bottleFill = useTweenedNumber(
		isBottleFull(play) ? 100 : getBottleFill(game),
		BOTTLE_FILL_SECONDS,
	);
	const copy = VACCINE_GAME_COPY;

	// 터치 결과마다 화면 흔들림, 빨간 번쩍임, 병 튀기기를 튼다
	useEffect(() => {
		if (!lastTap) return;
		if (lastTap.outcome === "wrong") {
			if (shouldReduceMotion) return;
			animateScreen(screenScope.current, { x: [0, -18, 16, -12, 8, -4, 0] }, { duration: 0.4 });
			animateFlash(flashScope.current, { opacity: [0, 0.75, 0] }, { duration: 0.4 });
			return;
		}
		const bounce = lastTap.isVaccineCompleted ? [1, 1.35, 0.9, 1.08, 1] : [1, 1.12, 1];
		animateBottle(bottleScope.current, { scale: bounce }, { duration: 0.6 });
	}, [
		lastTap,
		shouldReduceMotion,
		animateScreen,
		screenScope,
		animateFlash,
		flashScope,
		animateBottle,
		bottleScope,
	]);

	function getFallingState(item: FallingAntigen): BallState {
		if (item.judgement) return item.judgement;
		return isHinting && neededKeys.has(antigenKey(item.antigen)) ? "hint" : "default";
	}

	const activeFalling = play.falling.filter((item) => item.judgement !== "correct");
	const collectedFalling = play.falling.filter((item) => item.judgement === "correct");

	return (
		<ScreenLayout onAdminActivate={onAdminActivate} background={<GameBackground />}>
			<div ref={screenScope} className="absolute inset-0">
				<PlayTimer
					time={formatSeconds(Math.ceil(remainingMs / 1000), language)}
					progress={remainingMs / game.durationMs}
					className={cn("absolute", layout.timer)}
				/>

				<section className={cn(PANEL, "flex", layout.rail)}>
					<div className={layout.stats}>
						<motion.div
							key={`score-${game.score}`}
							initial={shouldReduceMotion ? false : { scale: 1.15 }}
							animate={{ scale: 1 }}
							transition={{ type: "spring", stiffness: 500, damping: 15 }}>
							<StatBox label={copy.score[language]} value={formatScore(game.score)} />
						</motion.div>
						<motion.div
							key={`completed-${game.completedCount}`}
							initial={shouldReduceMotion ? false : { scale: 1.25 }}
							animate={{ scale: 1 }}
							transition={{ type: "spring", stiffness: 400, damping: 12 }}
							className="order-last">
							<StatBox
								label={copy.completed[language]}
								value={formatCount(game.completedCount, language)}
							/>
						</motion.div>
					</div>
					<div className="flex h-25 w-75 shrink-0 items-center justify-center">
						{vaccine && (
							<motion.img
								key={vaccine.id}
								initial={shouldReduceMotion ? false : { opacity: 0, y: -12 }}
								animate={{ opacity: 1, y: 0 }}
								src={getImageUrl(vaccine.logoImage[language])}
								alt={vaccine.productName[language]}
								draggable={false}
								className="max-h-full max-w-full object-contain"
							/>
						)}
					</div>
					<div ref={bottleScope}>
						<VaccineBottle
							fill={bottleFill}
							label={copy.bottleLabel[language]}
							className={layout.bottle}
						/>
					</div>
				</section>

				<div className={cn("absolute", layout.field)}>
					<div className="absolute inset-0 rounded-2xl border-2 border-dashed border-border-default bg-background-surface" />

					<ul className={cn(PANEL, "flex", layout.antigenList)}>
						{vaccine?.antigens.map((antigen, index) => {
							const isCollected = !neededKeys.has(antigenKey(antigen));
							return (
								<motion.li
									key={`${game.vaccineIndex}-${game.completedCount}-${antigenKey(antigen)}`}
									initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
									animate={{ scale: 1, opacity: isCollected ? 1 : 0.4 }}
									transition={{
										type: "spring",
										stiffness: 400,
										damping: 18,
										delay: index * 0.07,
									}}>
									<SizedAntigenBall
										label={toAntigenLabel(antigen, colors)}
										size={layout.listBallSize}
										state={isCollected ? "correct" : "default"}
									/>
								</motion.li>
							);
						})}
					</ul>

					<div className={cn("absolute overflow-hidden", layout.falling)}>
						{activeFalling.map((item) => (
							<button
								key={item.id}
								type="button"
								aria-label={formatAntigenLabel(item.antigen)}
								onPointerDown={() => tap(item.id)}
								className="absolute top-0 left-0 touch-none"
								style={{
									transform: `translate(${item.x + getSway(item, shouldReduceMotion)}px, ${item.y - FALLING_BALL_SIZE}px)`,
								}}>
								<motion.div
									initial={shouldReduceMotion ? false : { scale: 0.3 }}
									animate={
										item.judgement === "wrong" && !shouldReduceMotion
											? { scale: 0.85, rotate: 540 }
											: { scale: 1 }
									}
									transition={
										item.judgement === "wrong"
											? { duration: 1, ease: "easeIn" }
											: { type: "spring", stiffness: 500, damping: 14 }
									}>
									<SizedAntigenBall
										label={toAntigenLabel(item.antigen, colors)}
										size={FALLING_BALL_SIZE}
										state={getFallingState(item)}
									/>
								</motion.div>
							</button>
						))}
					</div>

					{play.feedback && (
						<motion.p
							key={play.feedback.shownAtMs}
							role="status"
							initial={shouldReduceMotion ? false : { y: -24, scale: 0.8, opacity: 0 }}
							animate={{ y: 0, scale: 1, opacity: 1 }}
							transition={{ type: "spring", stiffness: 500, damping: 16 }}
							className={cn(
								"typo-body-l pointer-events-none absolute flex h-20 items-center whitespace-nowrap",
								"rounded-3xl px-10",
								"border-2 border-border-error bg-state-error-subtle text-text-primary",
								layout.feedback,
							)}>
							{formatMissingAntigen(formatAntigenLabel(play.feedback.missing), language)}
						</motion.p>
					)}
				</div>
			</div>

			<div aria-hidden="true" className="pointer-events-none absolute inset-0">
				{collectedFalling.map((item) => {
					const left = layout.fallingOrigin.x + item.x;
					const top = layout.fallingOrigin.y + item.y - FALLING_BALL_SIZE;
					return (
						<motion.div
							key={item.id}
							className="absolute"
							style={{ left, top }}
							initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
							animate={
								shouldReduceMotion
									? { opacity: 0 }
									: {
											x: layout.bottleCenter.x - (left + HALF_BALL),
											y: layout.bottleCenter.y - (top + HALF_BALL),
											scale: [1.2, 0.3],
											opacity: [1, 1, 0.2],
										}
							}
							transition={{ duration: CORRECT_VISIBLE_MS / 1000, ease: "easeIn" }}>
							<SizedAntigenBall
								label={toAntigenLabel(item.antigen, colors)}
								size={FALLING_BALL_SIZE}
								state="correct"
							/>
						</motion.div>
					);
				})}

				{lastTap?.outcome === "correct" && (
					<motion.p
						key={`points-${lastTap.seq}`}
						className="typo-display-m absolute whitespace-nowrap font-display text-state-success-strong"
						style={{
							left: layout.fallingOrigin.x + lastTap.x + 40,
							top: layout.fallingOrigin.y + lastTap.y - FALLING_BALL_SIZE,
						}}
						initial={{ opacity: 0, y: 0, scale: 0.6 }}
						animate={{ opacity: [0, 1, 1, 0], y: -110, scale: 1 }}
						transition={{ duration: 0.9, ease: "easeOut" }}>
						+{lastTap.scoreDelta}
					</motion.p>
				)}

				{lastTap?.outcome === "correct" && lastTap.combo >= COMBO_START && (
					<motion.p
						key={`combo-${lastTap.seq}`}
						className={cn(
							"typo-display-l absolute -translate-x-1/2 whitespace-nowrap font-display text-brand-primary",
							layout.combo,
						)}
						initial={{ opacity: 0, scale: 0.4 }}
						animate={{ opacity: [0, 1, 1, 0], scale: [0.4, 1.15, 1, 1] }}
						transition={{ duration: 1, times: [0, 0.25, 0.7, 1] }}>
						{formatCombo(lastTap.combo, language)}
					</motion.p>
				)}

				<div ref={flashScope} className={cn("absolute inset-0 opacity-0", ERROR_EDGE)} />
				{isWarning && !shouldReduceMotion && (
					<motion.div
						className={cn("absolute inset-0", ERROR_EDGE)}
						initial={{ opacity: 0 }}
						animate={{ opacity: [0.1, 0.55, 0.1] }}
						transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
					/>
				)}
			</div>
		</ScreenLayout>
	);
}
