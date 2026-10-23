import { useCallback, useEffect, useEffectEvent, useState } from "react";
import bgmVaccineGame from "@/assets/sounds/bgmVaccineGame.mp3";
import GameBackground from "@/components/common/GameBackground";
import type { GameResult } from "@/features/vaccine-game/utils/game";
import { type GameSetup, loadSetup } from "@/features/vaccine-game/utils/setup";
import ScreenLayout from "@/layout/ScreenLayout";
import { useBgm } from "@/pages/vaccine/useBgm";
import VaccinePlay from "@/pages/vaccine/VaccinePlay";
import VaccineRecipe from "@/pages/vaccine/VaccineRecipe";
import VaccineResult from "@/pages/vaccine/VaccineResult";
import { useSessionStore } from "@/store/sessionStore";

type Step = { type: "recipe" } | { type: "play" } | { type: "result"; result: GameResult };

type VaccineGamePageProps = {
	onHome: () => void;
	onAdminActivate: () => void;
};

export default function VaccineGamePage({ onHome, onAdminActivate }: VaccineGamePageProps) {
	const language = useSessionStore((s) => s.language);
	// 02~04 를 이 화면이 감싸므로 화면이 바뀌어도 배경음이 끊기지 않습니다
	useBgm(bgmVaccineGame);
	const [setup, setSetup] = useState<GameSetup | null>(null);
	const [step, setStep] = useState<Step>({ type: "recipe" });

	// onHome 이 바뀌어도 설정을 다시 읽지 않아야 판 도중에 항원 색이 바뀌지 않는다
	const handleNoVaccine = useEffectEvent(() => onHome());

	useEffect(() => {
		let isActive = true;
		loadSetup().then((loaded) => {
			if (!isActive) return;
			// 켜진 백신이 없으면 할 수 있는 게임이 없으니 대기 화면으로 돌아간다
			if (loaded.round.length === 0) handleNoVaccine();
			else setSetup(loaded);
		});
		return () => {
			isActive = false;
		};
	}, []);

	const handleRecipeDone = useCallback(() => setStep({ type: "play" }), []);
	const handleFinish = useCallback((result: GameResult) => setStep({ type: "result", result }), []);

	// 불러오는 동안에도 관리자 진입 영역은 살아 있어야 합니다
	if (!setup) {
		return (
			<ScreenLayout onAdminActivate={onAdminActivate} background={<GameBackground />}>
				{null}
			</ScreenLayout>
		);
	}

	if (step.type === "recipe") {
		return (
			<VaccineRecipe
				vaccines={setup.round}
				colors={setup.colors}
				language={language}
				onDone={handleRecipeDone}
				onAdminActivate={onAdminActivate}
			/>
		);
	}

	if (step.type === "play") {
		return (
			<VaccinePlay
				round={setup.round}
				allVaccines={setup.allVaccines}
				settings={setup.settings}
				playDurationSeconds={setup.playDurationSeconds}
				colors={setup.colors}
				language={language}
				onFinish={handleFinish}
				onAdminActivate={onAdminActivate}
			/>
		);
	}

	return (
		<VaccineResult
			result={step.result}
			colors={setup.colors}
			language={language}
			onHome={onHome}
			onAdminActivate={onAdminActivate}
		/>
	);
}
