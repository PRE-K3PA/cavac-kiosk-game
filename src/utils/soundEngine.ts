import bgmCardGame from "@/assets/sounds/bgmCardGame.mp3";
import bgmCardHome from "@/assets/sounds/bgmCardHome.mp3";
import sfxButton from "@/assets/sounds/sfxButton.wav";
import sfxFanfare from "@/assets/sounds/sfxFanfare.wav";
import sfxMatch from "@/assets/sounds/sfxMatch.wav";
import sfxPop from "@/assets/sounds/sfxPop.wav";
import sfxTick from "@/assets/sounds/sfxTick.wav";
import sfxTickUrgent from "@/assets/sounds/sfxTickUrgent.wav";
import sfxWrong from "@/assets/sounds/sfxWrong.wav";

// 소리를 바꾸려면 src/assets/sounds/ 에서 같은 이름의 wav 를 덮어씁니다.
// 확장자가 다르면 위 import 경로만 고칩니다. 소리 이름과 playSound 는 그대로입니다.

export const SOUND_NAMES = {
	pop: "pop",
	button: "button",
	match: "match",
	wrong: "wrong",
	tick: "tick",
	tickUrgent: "tickUrgent",
	fanfare: "fanfare",
} as const;

export type SoundName = (typeof SOUND_NAMES)[keyof typeof SOUND_NAMES];

const SOUNDS: Record<SoundName, string> = {
	pop: sfxPop,
	button: sfxButton,
	match: sfxMatch,
	wrong: sfxWrong,
	tick: sfxTick,
	tickUrgent: sfxTickUrgent,
	fanfare: sfxFanfare,
};

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
	try {
		const player = getSource(name)?.cloneNode() as HTMLAudioElement | undefined;
		// 자동재생 정책이나 파일 문제로 거절돼도 게임은 계속됩니다
		player?.play().catch(() => {});
	} catch {
		// 소리가 안 나도 게임은 계속됩니다
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

/** 배경음은 한 곡만 반복합니다. 이미 그 곡이 나오고 있으면 처음부터 다시 틀지 않습니다 */
export function playBgm(name: BgmName) {
	if (bgm?.name === name) return;
	stopBgm();
	try {
		if (typeof Audio === "undefined") return;
		const player = new Audio(BGMS[name]);
		player.loop = true;
		player.volume = BGM_VOLUME[name];
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
