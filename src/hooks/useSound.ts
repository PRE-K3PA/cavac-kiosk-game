import { useEffect } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { playSound, type SoundName, startSound } from "@/utils/soundEngine";

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
