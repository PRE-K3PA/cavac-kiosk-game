import { useSessionStore } from "@/store/sessionStore";
import { playSound, type SoundName } from "@/utils/soundEngine";

/** 홈의 소리 버튼이 정한 음소거를 따르는 재생 함수를 돌려줍니다 */
export function useSound(): (name: SoundName) => void {
	const isMuted = useSessionStore((s) => s.isMuted);
	return (name) => {
		if (!isMuted) playSound(name);
	};
}
