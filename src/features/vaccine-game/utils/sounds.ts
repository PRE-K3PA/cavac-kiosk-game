import { WARNING_RATIO } from "@/components/common/PlayTimer";
import { getRemainingMs, isGameOver } from "@/features/vaccine-game/utils/game";
import type { PlayState } from "@/features/vaccine-game/utils/play";
import { SOUND_NAMES, type SoundName } from "@/utils/soundEngine";

function getTapSound(before: PlayState, after: PlayState): SoundName | null {
	const tap = after.lastTap;
	if (!tap || tap.seq === before.lastTap?.seq) return null;
	return tap.outcome === "correct" ? SOUND_NAMES.match : SOUND_NAMES.wrong;
}

// 시간 패널티로 여러 초가 한꺼번에 줄어도 한 번만 울립니다
function getTickSound(before: PlayState, after: PlayState): SoundName | null {
	if (isGameOver(before.game) || isGameOver(after.game)) return null;
	const beforeSeconds = Math.ceil(getRemainingMs(before.game) / 1000);
	const afterSeconds = Math.ceil(getRemainingMs(after.game) / 1000);
	if (afterSeconds === beforeSeconds) return null;

	const isUrgent = getRemainingMs(after.game) / after.game.durationMs <= WARNING_RATIO;
	return isUrgent ? SOUND_NAMES.tickUrgent : SOUND_NAMES.tick;
}

/** 03 게임의 두 상태 사이에서 낼 효과음을 순서대로 돌려줍니다 */
export function getVaccineGameSounds(before: PlayState, after: PlayState): SoundName[] {
	const sounds: SoundName[] = [];
	const tapSound = getTapSound(before, after);
	if (tapSound) sounds.push(tapSound);
	const tickSound = getTickSound(before, after);
	if (tickSound) sounds.push(tickSound);
	if (!isGameOver(before.game) && isGameOver(after.game)) sounds.push(SOUND_NAMES.fanfare);
	return sounds;
}
