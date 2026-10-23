import { isHintDelayTooLong } from "@/data/rules";
import type { VaccineGameData } from "@/types/data";

// 백신 설정 게임 설정 섹션의 정답 항원 힌트 화면 규칙

export const HINT_DELAY_PRESETS = [5, 10, 15, 20, 25, 30] as const;

/**
 * 설정 파일에 목록 밖의 값이 들어 있어도 다른 값을 골랐다가 되돌릴 수 있게 파일 값을 함께 넣습니다.
 * 초안 값은 이 목록에서만 고르므로 늘 목록 안에 있습니다
 */
export function getHintDelayOptions(savedSeconds: number): { value: number; label: string }[] {
	const seconds = new Set<number>([...HINT_DELAY_PRESETS, savedSeconds]);
	return [...seconds].sort((a, b) => a - b).map((value) => ({ value, label: `${value}초` }));
}

/** 힌트 줄 아래 앰버 경고. 저장은 막지 않습니다 (Figma _HintWarning) */
export function getHintWarning(data: VaccineGameData, playDurationSeconds: number): string | null {
	if (!isHintDelayTooLong(data, playDurationSeconds)) return null;
	return `제한 시간(${playDurationSeconds}초) 안에 힌트가 나오지 않습니다.`;
}
