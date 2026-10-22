import { useEffect, useRef } from "react";
import { useSessionStore } from "@/store/sessionStore";

const BGM_VOLUME = 0.5;

/** 화면이 떠 있는 동안 배경음을 반복 재생합니다. 홈의 소리 버튼(음소거)을 따릅니다 */
export function useBgm(src: string) {
	const isMuted = useSessionStore((s) => s.isMuted);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		const audio = new Audio(src);
		audio.loop = true;
		audio.volume = BGM_VOLUME;
		audioRef.current = audio;
		return () => {
			audio.pause();
			audio.currentTime = 0;
			audioRef.current = null;
		};
	}, [src]);

	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		if (isMuted) {
			audio.pause();
			return;
		}

		// 자동 재생 정책 등으로 거절되면 첫 터치 때 한 번 더 시도합니다. 소리가 안 나도 게임은 계속됩니다
		function handleFirstPointerDown() {
			audio?.play().catch(() => undefined);
		}

		audio.play().catch(() => {
			document.addEventListener("pointerdown", handleFirstPointerDown, { once: true });
		});
		return () => document.removeEventListener("pointerdown", handleFirstPointerDown);
	}, [isMuted]);
}
