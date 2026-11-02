import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { DEFAULT_VOLUME } from "@/data/schema";
import {
	BGM_NAMES,
	getSfxLevel,
	playBgm,
	playSound,
	SOUND_NAMES,
	type SoundName,
	setVolume,
	startSound,
	stopBgm,
} from "@/utils/soundEngine";

let played: string[] = [];
let playedVolumes: number[] = [];
let playSpy: ReturnType<typeof spyOn<HTMLMediaElement, "play">>;

beforeEach(() => {
	played = [];
	playedVolumes = [];
	playSpy = spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
		this: HTMLMediaElement,
	) {
		played.push(this.src);
		playedVolumes.push(this.volume);
		return Promise.resolve();
	});
});

afterEach(() => {
	playSpy.mockRestore();
	setVolume(DEFAULT_VOLUME);
});

describe("getSfxLevel", () => {
	test("촉박한 틱은 효과음 크기의 1.2배다", () => {
		expect(getSfxLevel(SOUND_NAMES.tickUrgent, 100)).toBeCloseTo(1.2);
		expect(getSfxLevel(SOUND_NAMES.tickUrgent, 50)).toBeCloseTo(0.6);
	});

	test("배율이 없는 효과음은 효과음 크기 그대로다", () => {
		expect(getSfxLevel(SOUND_NAMES.tick, 100)).toBe(1);
		expect(getSfxLevel(SOUND_NAMES.tick, 50)).toBe(0.5);
	});

	test("효과음 크기가 0 이면 촉박한 틱도 0 이다", () => {
		expect(getSfxLevel(SOUND_NAMES.tickUrgent, 0)).toBe(0);
	});
});

describe("playSound", () => {
	test.each([
		"pop",
		"match",
		"wrong",
		"tick",
		"tickUrgent",
		"fanfare",
		"start",
	] satisfies SoundName[])("%s 은 같은 이름의 wav 파일을 재생한다", (name) => {
		playSound(name);

		const file = `sfx${name[0].toUpperCase()}${name.slice(1)}.wav`;
		expect(played).toHaveLength(1);
		expect(played[0]).toContain(file.replace(".wav", ""));
	});

	test("같은 소리를 연속으로 재생해도 예외가 없고 매번 재생된다", () => {
		expect(() => {
			playSound(SOUND_NAMES.tick);
			playSound(SOUND_NAMES.tick);
		}).not.toThrow();
		expect(played).toHaveLength(2);
	});

	test("재생이 거절돼도 예외가 올라오지 않는다", async () => {
		playSpy.mockImplementation(() => Promise.reject(new Error("NotAllowedError")));

		expect(() => playSound(SOUND_NAMES.pop)).not.toThrow();
		await Promise.resolve();
	});

	test("play 가 예외를 던져도 무시한다", () => {
		playSpy.mockImplementation(() => {
			throw new Error("boom");
		});

		expect(() => playSound(SOUND_NAMES.pop)).not.toThrow();
	});

	test("Audio 가 없는 환경에서는 조용히 무시한다", () => {
		const original = globalThis.Audio;
		Object.assign(globalThis, { Audio: undefined });
		try {
			expect(() => playSound(SOUND_NAMES.wrong)).not.toThrow();
			expect(played).toEqual([]);
		} finally {
			Object.assign(globalThis, { Audio: original });
		}
	});
});

describe("playBgm", () => {
	afterEach(() => {
		stopBgm();
	});

	test("배경음은 반복 재생한다", () => {
		playBgm(BGM_NAMES.cardHome);

		expect(played).toHaveLength(1);
		expect(played[0]).toContain("bgmCardHome");
	});

	test("이미 나오는 곡을 다시 요청하면 새로 틀지 않는다", () => {
		playBgm(BGM_NAMES.cardGame);
		playBgm(BGM_NAMES.cardGame);

		expect(played).toHaveLength(1);
	});

	test("다른 곡을 요청하면 앞 곡을 멈추고 바꾼다", () => {
		const pauseSpy = spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
		playBgm(BGM_NAMES.cardHome);
		playBgm(BGM_NAMES.cardGame);

		expect(pauseSpy).toHaveBeenCalledTimes(1);
		expect(played[1]).toContain("bgmCardGame");
		pauseSpy.mockRestore();
	});

	test("멈춘 뒤 같은 곡을 요청하면 다시 튼다", () => {
		playBgm(BGM_NAMES.cardHome);
		stopBgm();
		playBgm(BGM_NAMES.cardHome);

		expect(played).toHaveLength(2);
	});

	test("재생이 거절돼도 예외가 올라오지 않는다", async () => {
		playSpy.mockImplementation(() => Promise.reject(new Error("NotAllowedError")));

		expect(() => playBgm(BGM_NAMES.cardHome)).not.toThrow();
		await Promise.resolve();
	});
});

describe("startSound", () => {
	test("돌려받은 함수로 소리를 멈춘다", () => {
		const pauseSpy = spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
		const stop = startSound(SOUND_NAMES.countdown);
		stop();

		expect(played[0]).toContain("sfxCountdown");
		expect(pauseSpy).toHaveBeenCalledTimes(1);
		pauseSpy.mockRestore();
	});
});

describe("setVolume", () => {
	afterEach(() => {
		stopBgm();
	});

	test("효과음은 저장한 효과음 크기로 재생한다", () => {
		setVolume({ bgmPercent: 50, sfxPercent: 30 });
		playSound(SOUND_NAMES.pop);

		expect(playedVolumes[0]).toBeCloseTo(0.3);
	});

	test("촉박한 틱은 1.2배로 재생하고, 1 을 넘으면 audio 요소는 최대 크기로 둔다", () => {
		setVolume({ bgmPercent: 50, sfxPercent: 50 });
		playSound(SOUND_NAMES.tickUrgent);
		setVolume({ bgmPercent: 50, sfxPercent: 100 });
		playSound(SOUND_NAMES.tickUrgent);

		expect(playedVolumes[0]).toBeCloseTo(0.6);
		expect(playedVolumes[1]).toBe(1);
	});

	test("Web Audio 로 키우다 실패해도 소리는 재생한다", () => {
		const original = globalThis.AudioContext;
		Object.assign(globalThis, {
			AudioContext: class {
				constructor() {
					throw new Error("no audio");
				}
			},
		});
		try {
			playSound(SOUND_NAMES.tickUrgent);
			expect(played).toHaveLength(1);
		} finally {
			Object.assign(globalThis, { AudioContext: original });
		}
	});

	test("배경음은 곡마다 정한 크기에 저장한 배경음 크기를 곱한다", () => {
		setVolume({ bgmPercent: 100, sfxPercent: 100 });
		playBgm(BGM_NAMES.cardHome);
		stopBgm();
		setVolume({ bgmPercent: 50, sfxPercent: 100 });
		playBgm(BGM_NAMES.cardHome);

		expect(playedVolumes[1]).toBeCloseTo(playedVolumes[0] * 0.5);
	});

	test("0% 이면 소리 크기가 0 이다", () => {
		setVolume({ bgmPercent: 0, sfxPercent: 0 });
		playSound(SOUND_NAMES.pop);
		playBgm(BGM_NAMES.cardGame);

		expect(playedVolumes).toEqual([0, 0]);
	});

	test("나오고 있는 배경음의 크기도 바로 바꾼다", () => {
		let player: HTMLMediaElement | undefined;
		playSpy.mockImplementation(function (this: HTMLMediaElement) {
			player = this;
			return Promise.resolve();
		});
		setVolume({ bgmPercent: 100, sfxPercent: 100 });
		playBgm(BGM_NAMES.cardGame);
		const fullVolume = player?.volume ?? 0;
		setVolume({ bgmPercent: 0, sfxPercent: 100 });

		expect(fullVolume).toBeGreaterThan(0);
		expect(player?.volume).toBe(0);
	});
});
