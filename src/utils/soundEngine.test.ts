import { afterEach, beforeEach, describe, expect, spyOn, test } from "bun:test";
import { playSound, SOUND_NAMES, type SoundName } from "@/utils/soundEngine";

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
