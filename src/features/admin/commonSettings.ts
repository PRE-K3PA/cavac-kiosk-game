// TODO: 클라이언트 확인 전 임시 목록
export const IDLE_SECONDS_PRESETS = [30, 60, 90, 120, 180] as const;

/** 설정 파일에 목록 밖의 값이 들어 있어도 선택 칸이 비지 않게 현재 값을 함께 넣습니다 */
export function getIdleSecondsOptions(current: number): { value: number; label: string }[] {
	const seconds = new Set<number>([...IDLE_SECONDS_PRESETS, current]);
	return [...seconds].sort((a, b) => a - b).map((value) => ({ value, label: `${value}초` }));
}
