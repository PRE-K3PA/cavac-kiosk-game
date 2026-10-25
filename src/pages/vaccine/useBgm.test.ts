import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { act, cleanup, renderHook } from "@testing-library/react";
import { StrictMode } from "react";
import { useBgm } from "@/pages/vaccine/useBgm";
import { useSessionStore } from "@/store/sessionStore";

class FakeAudio {
	static instances: FakeAudio[] = [];
	static playResults: Promise<void>[] = [];

	src: string;
	loop = false;
	volume = 1;
	currentTime = 0;
	paused = true;
	playCount = 0;

	constructor(src: string) {
		this.src = src;
		FakeAudio.instances.push(this);
	}

	isPlayPending = false;
	isPausedWhilePending = false;

	// 실제 브라우저처럼 재생이 시작되기 전에 pause 되면 play() 는 거부됩니다
	play(): Promise<void> {
		this.playCount += 1;
		this.isPlayPending = true;
		const result = FakeAudio.playResults.shift() ?? Promise.resolve();
		return result.then(() => {
			this.isPlayPending = false;
			if (this.isPausedWhilePending) {
				this.isPausedWhilePending = false;
				throw new Error("AbortError");
			}
			this.paused = false;
		});
	}

	pause() {
		if (this.isPlayPending) this.isPausedWhilePending = true;
		this.paused = true;
	}
}

const originalAudio = globalThis.Audio;

function lastAudio(): FakeAudio {
	const audio = FakeAudio.instances.at(-1);
	if (!audio) throw new Error("Audio 가 만들어지지 않았습니다");
	return audio;
}

async function flushPromises() {
	await act(async () => {
		await Promise.resolve();
	});
}

beforeEach(() => {
	FakeAudio.instances = [];
	FakeAudio.playResults = [];
	globalThis.Audio = FakeAudio as unknown as typeof Audio;
});

afterEach(() => {
	cleanup();
	globalThis.Audio = originalAudio;
	useSessionStore.getState().reset();
});

describe("useBgm", () => {
	test("화면이 나타나면 반복 재생한다", async () => {
		renderHook(() => useBgm("bgm.mp3"));
		await flushPromises();

		const audio = lastAudio();
		expect(audio.src).toBe("bgm.mp3");
		expect(audio.loop).toBe(true);
		expect(audio.playCount).toBe(1);
		expect(audio.paused).toBe(false);
	});

	test("음소거면 재생하지 않고, 음소거를 풀면 이어서 재생한다", async () => {
		useSessionStore.getState().toggleMute();
		renderHook(() => useBgm("bgm.mp3"));
		await flushPromises();

		const audio = lastAudio();
		expect(audio.playCount).toBe(0);

		act(() => useSessionStore.getState().toggleMute());
		await flushPromises();

		expect(FakeAudio.instances).toHaveLength(1);
		expect(audio.playCount).toBe(1);
	});

	test("화면이 사라지면 멈추고 처음으로 되돌린다", async () => {
		const { unmount } = renderHook(() => useBgm("bgm.mp3"));
		await flushPromises();
		const audio = lastAudio();
		audio.currentTime = 12;

		unmount();

		expect(audio.paused).toBe(true);
		expect(audio.currentTime).toBe(0);
	});

	test("재생이 거부돼도 예외 없이 첫 터치 때 다시 재생한다", async () => {
		FakeAudio.playResults = [Promise.reject(new Error("autoplay"))];
		renderHook(() => useBgm("bgm.mp3"));
		await flushPromises();

		const audio = lastAudio();
		expect(audio.playCount).toBe(1);

		act(() => {
			document.dispatchEvent(new Event("pointerdown"));
		});
		await flushPromises();

		expect(audio.playCount).toBe(2);
		expect(audio.paused).toBe(false);
	});

	test("화면이 사라진 뒤에 재생 거부가 와도 터치했을 때 다시 재생하지 않는다", async () => {
		FakeAudio.playResults = [Promise.reject(new Error("autoplay"))];
		const { unmount } = renderHook(() => useBgm("bgm.mp3"));
		unmount();
		await flushPromises();

		act(() => {
			document.dispatchEvent(new Event("pointerdown"));
		});
		await flushPromises();

		expect(lastAudio().playCount).toBe(1);
		expect(lastAudio().paused).toBe(true);
	});

	test("StrictMode 에서 두 번 실행돼도 터치했을 때 한 곡만 재생한다", async () => {
		renderHook(() => useBgm("bgm.mp3"), { wrapper: StrictMode });
		await flushPromises();

		act(() => {
			document.dispatchEvent(new Event("pointerdown"));
		});
		await flushPromises();

		const playing = FakeAudio.instances.filter((audio) => !audio.paused);
		expect(playing).toHaveLength(1);
	});
});
