import { useEffect } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { SOUND_NAMES, startSound } from "@/utils/soundEngine";

// 카운트다운 소리 파일은 4초 지점부터 "텅" 소리가 나서, 틱톡인 앞 4초만 처음부터 되풀이합니다.
// 틱이 1초 간격이라 4초마다 다시 틀어도 박자가 이어집니다
export const COUNTDOWN_LOOP_MS = 4000;

/** 02 레시피 화면 동안 틱톡만 들리게 카운트다운 소리를 되풀이합니다. 음소거하면 바로 멈춥니다 */
export function useRecipeCountdownSound() {
	const isMuted = useSessionStore((s) => s.isMuted);

	useEffect(() => {
		if (isMuted) return;
		let stop = startSound(SOUND_NAMES.countdown);
		const timerId = setInterval(() => {
			stop();
			stop = startSound(SOUND_NAMES.countdown);
		}, COUNTDOWN_LOOP_MS);
		return () => {
			clearInterval(timerId);
			stop();
		};
	}, [isMuted]);
}
