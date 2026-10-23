import { useEffect } from "react";
import { useSessionStore } from "@/store/sessionStore";
import { type BgmName, playBgm, stopBgm } from "@/utils/soundEngine";

/** 화면에 있는 동안 배경음을 틉니다. null 이거나 음소거면 멈춥니다 */
export function useBgm(name: BgmName | null) {
	const isMuted = useSessionStore((s) => s.isMuted);

	useEffect(() => {
		if (!name || isMuted) return;
		playBgm(name);
		return stopBgm;
	}, [name, isMuted]);
}
