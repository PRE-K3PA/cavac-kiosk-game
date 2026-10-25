import bgmCardGame from "@/assets/sounds/bgmCardGame.mp3";
import bgmCardHome from "@/assets/sounds/bgmCardHome.mp3";
import sfxButton from "@/assets/sounds/sfxButton.wav";
import sfxCountdown from "@/assets/sounds/sfxCountdown.mp3";
import sfxFanfare from "@/assets/sounds/sfxFanfare.wav";
import sfxMatch from "@/assets/sounds/sfxMatch.wav";
import sfxPop from "@/assets/sounds/sfxPop.wav";
import sfxStart from "@/assets/sounds/sfxStart.wav";
import sfxTick from "@/assets/sounds/sfxTick.wav";
import sfxTickUrgent from "@/assets/sounds/sfxTickUrgent.wav";
import sfxWrong from "@/assets/sounds/sfxWrong.wav";
import { DEFAULT_VOLUME } from "@/data/schema";
import type { CommonData } from "@/types/data";

// 소리를 바꾸려면 src/assets/sounds/ 에서 같은 이름의 wav 를 덮어씁니다.
// 확장자가 다르면 위 import 경로만 고칩니다. 소리 이름과 playSound 는 그대로입니다.

export const SOUND_NAMES = {
	pop: "pop",
	countdown: "countdown",
	button: "button",
	match: "match",
	wrong: "wrong",
	tick: "tick",
	tickUrgent: "tickUrgent",
	fanfare: "fanfare",
	start: "start",
} as const;

export type SoundName = (typeof SOUND_NAMES)[keyof typeof SOUND_NAMES];

const SOUNDS: Record<SoundName, string> = {
	pop: sfxPop,
	countdown: sfxCountdown,
	button: sfxButton,
	match: sfxMatch,
	wrong: sfxWrong,
	tick: sfxTick,
	tickUrgent: sfxTickUrgent,
	fanfare: sfxFanfare,
	start: sfxStart,
};

type Volume = CommonData["volume"];

// 관리자가 저장한 크기는 setVolume 으로 들어옵니다. 읽기 전에 나는 소리는 기본값을 씁니다
let volume: Volume = { ...DEFAULT_VOLUME };

const loaded = new Map<SoundName, HTMLAudioElement>();

// 처음 쓸 때 한 번 읽어 두고, 재생은 복제본으로 해서 같은 소리가 겹쳐도 끊기지 않게 합니다
function getSource(name: SoundName): HTMLAudioElement | null {
	if (typeof Audio === "undefined") return null;
	const cached = loaded.get(name);
	if (cached) return cached;
	const source = new Audio(SOUNDS[name]);
	source.preload = "auto";
	loaded.set(name, source);
	return source;
}

export function playSound(name: SoundName) {
	startSound(name);
}

/** 재생하고, 소리가 끝나기 전에 멈출 수 있는 함수를 돌려줍니다 */
export function startSound(name: SoundName): () => void {
	try {
		const player = getSource(name)?.cloneNode() as HTMLAudioElement | undefined;
		if (!player) return () => {};
		// volume 은 속성이 아니라 복제되지 않으므로 복제본마다 넣습니다
		player.volume = volume.sfxPercent / 100;
		// 자동재생 정책이나 파일 문제로 거절돼도 게임은 계속됩니다
		player.play().catch(() => {});
		return () => player.pause();
	} catch {
		// 소리가 안 나도 게임은 계속됩니다
		return () => {};
	}
}

export const BGM_NAMES = {
	cardHome: "cardHome",
	cardGame: "cardGame",
} as const;

export type BgmName = (typeof BGM_NAMES)[keyof typeof BGM_NAMES];

const BGMS: Record<BgmName, string> = {
	cardHome: bgmCardHome,
	cardGame: bgmCardGame,
};

// 효과음이 배경음에 묻히지 않게 낮춥니다. 게임 중에는 효과음이 잦아 더 낮춥니다
const BGM_VOLUME: Record<BgmName, number> = {
	cardHome: 0.5,
	cardGame: 0.4,
};

let bgm: { name: BgmName; player: HTMLAudioElement } | null = null;

// 저장한 배경음 크기는 곡마다 맞춘 크기에 곱해, 곡 사이의 균형을 유지합니다
function getBgmVolume(name: BgmName): number {
	return BGM_VOLUME[name] * (volume.bgmPercent / 100);
}

/** 이미 나오고 있는 배경음에도 바로 적용합니다. 홈이 설정을 읽기 전에 곡이 먼저 시작되기 때문입니다 */
export function setVolume(next: Volume) {
	volume = { ...next };
	if (!bgm) return;
	try {
		bgm.player.volume = getBgmVolume(bgm.name);
	} catch {
		// 크기를 못 바꿔도 다음 곡부터는 새 크기로 틉니다
	}
}

/** 배경음은 한 곡만 반복합니다. 이미 그 곡이 나오고 있으면 처음부터 다시 틀지 않습니다 */
export function playBgm(name: BgmName) {
	if (bgm?.name === name) return;
	stopBgm();
	try {
		if (typeof Audio === "undefined") return;
		const player = new Audio(BGMS[name]);
		player.loop = true;
		player.volume = getBgmVolume(name);
		bgm = { name, player };
		player.play().catch(() => {});
	} catch {
		// 배경음이 안 나도 게임은 계속됩니다
	}
}

export function stopBgm() {
	if (!bgm) return;
	try {
		bgm.player.pause();
	} catch {
		// 멈추지 못해도 다음 곡은 새 Audio 로 틉니다
	}
	bgm = null;
}
