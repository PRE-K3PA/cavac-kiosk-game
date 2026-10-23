import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import {
	BGM_NAMES,
	playBgm,
	playSound,
	SOUND_NAMES,
	type SoundName,
	startSound,
	stopBgm,
} from "@/utils/soundEngine";

let played: string[] = [];
let playSpy: ReturnType<typeof spyOn<HTMLMediaElement, "play">>;

beforeEach(() => {
	played = [];
	playSpy = spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
		this: HTMLMediaElement,
	) {
		played.push(this.src);
		return Promise.resolve();
	});
});

afterEach(() => {
	playSpy.mockRestore();
});

describe("playSound", () => {
	test.each(["pop", "match", "wrong", "tick", "tickUrgent", "fanfare"] satisfies SoundName[])(
		"%s 은 같은 이름의 wav 파일을 재생한다",
		(name) => {
			playSound(name);

			const file = `sfx${name[0].toUpperCase()}${name.slice(1)}.wav`;
			expect(played).toHaveLength(1);
			expect(played[0]).toContain(file.replace(".wav", ""));
		},
	);

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
