import { useEffect } from "react";
import { getDataOrDefault } from "@/data/load";
import { setVolume } from "@/utils/soundEngine";

/** 관리자가 저장한 배경음과 효과음 크기를 읽어 소리에 적용합니다. 읽지 못하면 기본값을 씁니다 */
export function useSoundVolume() {
	useEffect(() => {
		getDataOrDefault("common").then((common) => setVolume(common.volume));
	}, []);
}
