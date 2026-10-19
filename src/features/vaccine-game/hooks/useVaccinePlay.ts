import { useEffect, useEffectEvent, useRef, useState } from "react";
import { type GameResult, getGameResult, isGameOver } from "@/features/vaccine-game/game";
import {
	advancePlay,
	createPlay,
	type PlayOptions,
	type PlayState,
	tapFalling,
} from "@/features/vaccine-game/play";
import type { Vaccine, VaccineGameSettings } from "@/types/data";

// 탭이 백그라운드였다 돌아오면 한 프레임 간격이 크게 벌어진다. 구슬이 한 번에 사라지지 않게 자른다
const MAX_FRAME_MS = 100;

type UseVaccinePlayParams = PlayOptions & {
	round: Vaccine[];
	settings: VaccineGameSettings;
	playDurationSeconds: number;
	onFinish: (result: GameResult) => void;
};

export function useVaccinePlay({
	round,
	settings,
	playDurationSeconds,
	onFinish,
	...options
}: UseVaccinePlayParams) {
	const [play, setPlay] = useState<PlayState>(() =>
		createPlay(round, settings, playDurationSeconds),
	);
	const optionsRef = useRef(options);
	optionsRef.current = options;
	const isOver = isGameOver(play.game);

	useEffect(() => {
		let frameId = 0;
		let lastTime = performance.now();

		function handleFrame(time: number) {
			const deltaMs = Math.min(time - lastTime, MAX_FRAME_MS);
			lastTime = time;
			setPlay((current) => advancePlay(current, deltaMs, optionsRef.current));
			frameId = requestAnimationFrame(handleFrame);
		}

		frameId = requestAnimationFrame(handleFrame);
		return () => cancelAnimationFrame(frameId);
	}, []);

	const finish = useEffectEvent(() => onFinish(getGameResult(play.game)));

	useEffect(() => {
		if (isOver) finish();
	}, [isOver]);

	function tap(id: number) {
		setPlay((current) => tapFalling(current, id));
	}

	return { play, tap };
}
