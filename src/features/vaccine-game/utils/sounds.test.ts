import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import {
	advancePlay,
	createPlay,
	type PlayOptions,
	type PlayState,
	tapFalling,
} from "@/features/vaccine-game/utils/play";
import { getVaccineGameSounds } from "@/features/vaccine-game/utils/sounds";
import { createFallingAntigen } from "@/features/vaccine-game/utils/spawn";
import type { Antigen, Penalty, Vaccine } from "@/types/data";
import { SOUND_NAMES } from "@/utils/soundEngine";

function antigen(abbr: string): Antigen {
	return { id: abbr, abbr, subtype: null, pathogenType: "virus", isPinned: false };
}

function vaccine(id: string, antigens: Antigen[]): Vaccine {
	return { ...createMockData("filled")["vaccine-game"].vaccines[0], id, antigens };
}

const HA = antigen("HA");
const NA = antigen("NA");
const ND = antigen("ND");

const ROUND = [vaccine("a", [HA, NA]), vaccine("b", [ND])];

const OPTIONS: PlayOptions = {
	allVaccines: ROUND,
	field: { width: 1000, height: 900, ballSize: 200 },
	random: () => 0,
};

const NO_PENALTY: Penalty = {
	time: { isEnabled: false, seconds: 3 },
	score: { isEnabled: false, points: 50 },
};

function play(penalty: Penalty = NO_PENALTY): PlayState {
	const settings = createMockData("filled")["vaccine-game"].settings;
	return createPlay(ROUND, { ...settings, penalty }, 60);
}

function withFalling(state: PlayState, item: Antigen, id = 1): PlayState {
	return { ...state, falling: [{ ...createFallingAntigen(id, item, 0), y: 100 }], nextId: id + 1 };
}

describe("getVaccineGameSounds", () => {
	test("정답을 누르면 match 를 낸다", () => {
		const before = withFalling(play(), HA);

		expect(getVaccineGameSounds(before, tapFalling(before, 1))).toEqual([SOUND_NAMES.match]);
	});

	test("오답을 누르면 wrong 을 낸다", () => {
		const before = withFalling(play(), ND);

		expect(getVaccineGameSounds(before, tapFalling(before, 1))).toEqual([SOUND_NAMES.wrong]);
	});

	test("이미 모은 항원을 다시 누르면 wrong 을 낸다", () => {
		const collected = tapFalling(withFalling(play(), HA), 1);
		const before = withFalling(collected, HA, 2);

		expect(getVaccineGameSounds(before, tapFalling(before, 2))).toEqual([SOUND_NAMES.wrong]);
	});

	test("남은 시간이 1초 줄면 tick 을 낸다", () => {
		const before = play();

		expect(getVaccineGameSounds(before, advancePlay(before, 1000, OPTIONS))).toEqual([
			SOUND_NAMES.tick,
		]);
	});

	test("남은 시간이 전체의 1/6 이하면 tickUrgent 를 낸다", () => {
		const before = advancePlay(play(), 50_000, OPTIONS);

		expect(getVaccineGameSounds(before, advancePlay(before, 1000, OPTIONS))).toEqual([
			SOUND_NAMES.tickUrgent,
		]);
	});

	test("시간 패널티로 남은 시간이 여러 초 줄어도 tick 은 한 번만 낸다", () => {
		const penalty = { ...NO_PENALTY, time: { isEnabled: true, seconds: 3 } };
		const before = withFalling(play(penalty), ND);

		expect(getVaccineGameSounds(before, tapFalling(before, 1))).toEqual([
			SOUND_NAMES.wrong,
			SOUND_NAMES.tick,
		]);
	});

	test("게임이 끝나는 순간에는 tick 없이 fanfare 만 낸다", () => {
		const before = advancePlay(play(), 59_500, OPTIONS);

		expect(getVaccineGameSounds(before, advancePlay(before, 1000, OPTIONS))).toEqual([
			SOUND_NAMES.fanfare,
		]);
	});

	test("이미 낸 터치 소리는 다음 상태에서 다시 내지 않는다", () => {
		const tapped = tapFalling(withFalling(play(), HA), 1);

		expect(getVaccineGameSounds(tapped, tapped)).toEqual([]);
		expect(getVaccineGameSounds(tapped, advancePlay(tapped, 100, OPTIONS))).toEqual([]);
	});

	test("남은 초가 그대로이고 누른 것이 없으면 소리가 없다", () => {
		const before = play();

		expect(getVaccineGameSounds(before, before)).toEqual([]);
		expect(getVaccineGameSounds(before, advancePlay(before, 100, OPTIONS))).toEqual([]);
	});
});
