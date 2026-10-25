import { useEffect, useRef } from "react";
import type { PlayState } from "@/features/vaccine-game/utils/play";
import { getVaccineGameSounds } from "@/features/vaccine-game/utils/sounds";
import { useSound } from "@/hooks/useSound";

/** 03 게임 상태가 바뀔 때마다 직전 상태와 비교해 효과음을 냅니다. 음소거는 useSound 가 따릅니다 */
export function useVaccineGameSounds(state: PlayState) {
	const play = useSound();
	const previous = useRef(state);

	useEffect(() => {
		const before = previous.current;
		previous.current = state;
		for (const sound of getVaccineGameSounds(before, state)) play(sound);
	}, [state, play]);
}
