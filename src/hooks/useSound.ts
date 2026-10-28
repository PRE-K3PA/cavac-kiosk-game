import { useEffect } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { playSound, SOUND_NAMES, type SoundName, startSound } from "@/utils/soundEngine";

// 카운트다운 소리 파일은 4초 지점부터 "텅" 소리가 나서, 틱톡인 앞 4초만 처음부터 되풀이합니다.
// 틱이 1초 간격이라 4초마다 다시 틀어도 박자가 이어집니다
export const COUNTDOWN_LOOP_MS = 4000;

/** 홈의 소리 버튼이 정한 음소거를 따르는 재생 함수를 돌려줍니다 */
export function useSound(): (name: SoundName) => void {
	const isMuted = useSessionStore((s) => s.isMuted);
	return (name) => {
		if (!isMuted) playSound(name);
	};
}

/** isActive 가 켜지는 순간 한 번 틀고, 꺼지거나 음소거하면 소리가 끝나기 전이라도 멈춥니다 */
export function useSoundWhile(name: SoundName, isActive: boolean) {
	const isMuted = useSessionStore((s) => s.isMuted);

	useEffect(() => {
		if (!isActive || isMuted) return;
		return startSound(name);
	}, [name, isActive, isMuted]);
}

/** isActive 동안 카운트다운 소리의 앞 4초만 되풀이하고, 꺼지거나 음소거하면 바로 멈춥니다 */
export function useCountdownSoundWhile(isActive: boolean) {
	const isMuted = useSessionStore((s) => s.isMuted);

	useEffect(() => {
		if (!isActive || isMuted) return;
		let stop = startSound(SOUND_NAMES.countdown);
		const timerId = setInterval(() => {
			stop();
			stop = startSound(SOUND_NAMES.countdown);
		}, COUNTDOWN_LOOP_MS);
		return () => {
			clearInterval(timerId);
			stop();
		};
	}, [isActive, isMuted]);
}
