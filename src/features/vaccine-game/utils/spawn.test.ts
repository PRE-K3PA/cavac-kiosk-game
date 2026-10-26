import { describe, expect, test } from "bun:test";
import { antigenKey } from "@/data/rules";
import {
	createFallingAntigen,
	type FallingAntigen,
	type FallingField,
	getDistractors,
	getFallSpeed,
	getSpawnGapMs,
	pickSpawnAntigen,
	pickSpawnX,
	shouldSpawn,
	stepFalling,
	WRONG_FALL_MULTIPLIER,
} from "@/features/vaccine-game/utils/spawn";
import type { Antigen, Vaccine } from "@/types/data";

function antigen(abbr: string, subtype: string | null = null): Antigen {
	return { id: `${abbr}-${subtype}`, abbr, subtype, pathogenType: "virus", isPinned: false };
}

function vaccine(id: string, antigens: Antigen[]): Vaccine {
	return {
		id,
		brandName: { ko: "", en: "" },
		productName: { ko: id, en: id },
		bottleImage: { ko: "", en: "" },
		logoImage: { ko: "", en: "" },
		isEnabled: true,
		antigens,
	};
}

const HA = antigen("HA");
const NA = antigen("NA");
const ND = antigen("ND");
const IB = antigen("IB");

const FIELD: FallingField = { width: 1000, height: 900, ballSize: 200 };

/** 칸이 남아 있는 경우만 쓰는 테스트에서 null 을 걸러 낸다 */
function freeLaneX(items: FallingAntigen[], value: number): number {
	const x = pickSpawnX(items, FIELD, () => value);
	if (x === null) throw new Error("빈 칸이 없습니다");
	return x;
}

function falling(item: Antigen, overrides: Partial<FallingAntigen> = {}): FallingAntigen {
	return { ...createFallingAntigen(1, item, 0), ...overrides };
}

describe("getDistractors", () => {
	test("이번 판 다른 백신의 항원 중 지금 백신에 없는 것을 한 번씩 고른다", () => {
		const current = vaccine("a", [HA, NA]);
		const round = [current, vaccine("b", [NA, ND]), vaccine("c", [ND, IB])];

		const keys = getDistractors(current, round, round, []).map(antigenKey);

		expect(keys).toEqual([ND, IB].map(antigenKey));
	});

	test("이번 판에 다른 항원이 없으면 전체 백신에서 고른다", () => {
		const current = vaccine("a", [HA]);
		const all = [current, vaccine("off", [IB])];

		expect(getDistractors(current, [current], all, []).map(antigenKey)).toEqual([antigenKey(IB)]);
	});

	test("어디에도 다른 항원이 없으면 빈 목록이다", () => {
		const current = vaccine("a", [HA]);

		expect(getDistractors(current, [current], [current], [])).toEqual([]);
	});

	test("지금 백신에서 이미 모은 항원도 오답 후보로 고른다", () => {
		const current = vaccine("a", [HA, NA]);
		const round = [current, vaccine("b", [ND])];

		const keys = getDistractors(current, round, round, [antigenKey(HA)]).map(antigenKey);

		expect(keys).toEqual([ND, HA].map(antigenKey));
	});

	test("아직 모으지 않은 항원은 오답 후보에 넣지 않는다", () => {
		const current = vaccine("a", [HA, NA]);

		const keys = getDistractors(current, [current], [current], [antigenKey(HA)]).map(antigenKey);

		expect(keys).not.toContain(antigenKey(NA));
	});
});

describe("pickSpawnAntigen", () => {
	test("떨어지는 항원 중에 필요한 항원이 없으면 필요한 항원을 고른다", () => {
		const picked = pickSpawnAntigen([HA], [ND], [falling(ND)], () => 0.99);

		expect(picked).toBe(HA);
	});

	test("필요한 항원이 떨어지고 있으면 화면에 가장 적게 떨어지고 있는 항원을 고른다", () => {
		const onScreen = [falling(HA), falling(HA), falling(NA), falling(ND)];

		expect(pickSpawnAntigen([HA, NA], [ND, IB], onScreen, () => 0)).toBe(IB);
	});

	test("가장 적게 떨어지는 항원이 여럿이면 그중에서 랜덤으로 고른다", () => {
		const onScreen = [falling(HA)];
		const candidates = [NA, ND, IB];

		const picked = [0, 0.5, 0.99].map((value) =>
			pickSpawnAntigen([HA, NA], [ND, IB], onScreen, () => value),
		);

		expect(new Set(picked).size).toBe(3);
		for (const item of picked) expect(item !== null && candidates.includes(item)).toBe(true);
	});

	test("남은 필요한 항원이 하나여도 같은 항원만 계속 고르지 않는다", () => {
		const onScreen = [falling(HA)];

		expect(pickSpawnAntigen([HA], [ND, IB], onScreen, () => 0)).not.toBe(HA);
	});

	test("필요한 항원과 다른 항원 사이에 같은 이름이 겹쳐도 한 번씩만 센다", () => {
		const onScreen = [falling(HA), falling(ND)];

		expect(pickSpawnAntigen([HA], [ND, HA], onScreen, () => 0.99)).not.toBe(HA);
	});

	test("판정이 끝난 항원은 떨어지는 필요한 항원으로 세지 않는다", () => {
		const judged = falling(HA, { judgement: "correct" });

		expect(pickSpawnAntigen([HA], [ND], [judged], () => 0.99)).toBe(HA);
	});

	test("다른 항원이 없으면 필요한 항원만 고른다", () => {
		expect(pickSpawnAntigen([HA], [], [falling(HA)], () => 0.99)).toBe(HA);
	});

	test("필요한 항원이 없으면 다른 항원을 고르고, 둘 다 없으면 고르지 않는다", () => {
		expect(pickSpawnAntigen([], [ND], [], () => 0)).toBe(ND);
		expect(pickSpawnAntigen([], [], [], () => 0)).toBeNull();
	});
});

describe("pickSpawnX", () => {
	test("구슬이 화면 밖으로 나가지 않는 칸에 놓는다", () => {
		for (const value of [0, 0.5, 0.999]) {
			const x = freeLaneX([], value);
			expect(x).toBeGreaterThanOrEqual(0);
			expect(x + FIELD.ballSize).toBeLessThanOrEqual(FIELD.width);
		}
	});

	test("위쪽에 막 떨어지기 시작한 구슬이 있는 칸은 피한다", () => {
		const firstLaneX = freeLaneX([], 0);
		const blocking = falling(HA, { x: firstLaneX, y: 0 });

		expect(pickSpawnX([blocking], FIELD, () => 0)).not.toBe(firstLaneX);
	});

	test("구슬이 구슬 크기만큼 내려간 칸은 다시 쓸 수 있다", () => {
		const firstLaneX = freeLaneX([], 0);
		const passed = falling(HA, { x: firstLaneX, y: FIELD.ballSize });

		expect(pickSpawnX([passed], FIELD, () => 0)).toBe(firstLaneX);
	});

	test("모든 칸이 막혀 있으면 놓지 않는다", () => {
		const lanes = [0, 0.2, 0.4, 0.6, 0.8].map((value) => freeLaneX([], value));
		const blocking = lanes.map((x) => falling(HA, { x, y: 0 }));

		expect(pickSpawnX(blocking, FIELD, () => 0)).toBeNull();
	});
});

describe("shouldSpawn", () => {
	test("화면의 구슬이 최대 개수보다 적고 간격이 지났으면 새로 떨어뜨린다", () => {
		expect(shouldSpawn([falling(HA)], 7, 1000, 600)).toBe(true);
	});

	test("화면의 구슬이 최대 개수면 떨어뜨리지 않는다", () => {
		const items = Array.from({ length: 7 }, () => falling(HA));

		expect(shouldSpawn(items, 7, 10_000, 600)).toBe(false);
	});

	test("직전에 떨어뜨린 뒤 간격이 지나지 않았으면 떨어뜨리지 않는다", () => {
		expect(shouldSpawn([], 7, 100, 600)).toBe(false);
	});

	test("받은 간격이 지났는지로 판단한다", () => {
		expect(shouldSpawn([], 7, 400, 400)).toBe(true);
		expect(shouldSpawn([], 7, 399, 400)).toBe(false);
	});
});

describe("stepFalling", () => {
	test("속도에 흐른 시간을 곱한 만큼 아래로 움직인다", () => {
		const [moved] = stepFalling([falling(HA, { y: 0 })], 500, 200, FIELD.height);

		expect(moved.y).toBe(100);
	});

	test("정답으로 판정한 구슬은 약병으로 날아가는 동안 멈춘다", () => {
		const [moved] = stepFalling([falling(HA, { y: 0, judgement: "correct" })], 500, 200, 900);

		expect(moved.y).toBe(0);
	});

	test(`오답으로 판정한 구슬은 ${WRONG_FALL_MULTIPLIER}배 빠르게 떨어진다`, () => {
		const [moved] = stepFalling([falling(HA, { y: 0, judgement: "wrong" })], 500, 200, 900);

		expect(moved.y).toBe(100 * WRONG_FALL_MULTIPLIER);
	});

	test("화면 아래로 완전히 나간 구슬은 뺀다", () => {
		const items = stepFalling([falling(HA, { y: 899 })], 100, 200, FIELD.height);

		expect(items).toEqual([]);
	});

	test("받은 목록을 바꾸지 않는다", () => {
		const items = [falling(HA, { y: 0 })];

		stepFalling(items, 500, 200, FIELD.height);

		expect(items[0].y).toBe(0);
	});
});

describe("getFallSpeed", () => {
	test("낙하 속도 설정을 기본 속도에 비율로 곱한다", () => {
		expect(getFallSpeed(150) / getFallSpeed(100)).toBeCloseTo(1.5);
		expect(getFallSpeed(50) / getFallSpeed(100)).toBeCloseTo(0.5);
	});
});

describe("getSpawnGapMs", () => {
	test("낙하 속도 50%·100%·150% 에서 1.2초·0.6초·0.4초 간격으로 떨어뜨린다", () => {
		expect(getSpawnGapMs(50)).toBe(1200);
		expect(getSpawnGapMs(100)).toBe(600);
		expect(getSpawnGapMs(150)).toBe(400);
	});

	test("낙하 속도가 달라도 구슬 사이 거리가 같다", () => {
		const gap = getFallSpeed(100) * getSpawnGapMs(100);

		expect(getFallSpeed(50) * getSpawnGapMs(50)).toBeCloseTo(gap);
		expect(getFallSpeed(150) * getSpawnGapMs(150)).toBeCloseTo(gap);
	});
});
