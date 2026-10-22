import { describe, expect, test } from "bun:test";
import { createMockData } from "@/data/mock/mock-platform";
import {
	COMBO_START,
	createGame,
	getBottleFill,
	getCurrentVaccine,
	getGameResult,
	getNeededAntigens,
	getRemainingMs,
	isGameOver,
	isHintActive,
	SCORE,
	tapAntigen,
	tickGame,
	type VaccineGame,
} from "@/features/vaccine-game/utils/game";
import type { Antigen, Vaccine, VaccineGameSettings } from "@/types/data";

function antigen(abbr: string, options: Partial<Antigen> = {}): Antigen {
	return {
		id: `${abbr}-${options.subtype ?? ""}`,
		abbr,
		subtype: null,
		pathogenType: "virus",
		isPinned: false,
		...options,
	};
}

function vaccine(id: string, antigens: Antigen[]): Vaccine {
	return { ...createMockData("filled")["vaccine-game"].vaccines[0], id, antigens };
}

function settings(overrides: Partial<VaccineGameSettings> = {}): VaccineGameSettings {
	return {
		fallSpeedPercent: 100,
		maxAntigensOnScreen: 7,
		hint: { isEnabled: true, delaySeconds: 5 },
		penalty: {
			time: { isEnabled: false, seconds: 3 },
			score: { isEnabled: false, points: 50 },
		},
		...overrides,
	};
}

const HA = antigen("HA");
const NA = antigen("NA");
const ND = antigen("ND");
const IB = antigen("IB");

function twoVaccineGame(gameSettings = settings()): VaccineGame {
	return createGame([vaccine("a", [HA, NA]), vaccine("b", [ND, IB])], gameSettings, 60);
}

function tapAll(game: VaccineGame, antigens: Antigen[]): VaccineGame {
	return antigens.reduce((current, item) => tapAntigen(current, item).game, game);
}

function deepFreeze<T>(value: T): T {
	if (typeof value === "object" && value !== null) {
		for (const child of Object.values(value)) deepFreeze(child);
		Object.freeze(value);
	}
	return value;
}

describe("판정", () => {
	test("지금 만드는 백신에 필요하고 아직 안 모은 항원은 정답이다", () => {
		const { outcome } = tapAntigen(twoVaccineGame(), HA);

		expect(outcome).toBe("correct");
	});

	test("다른 백신의 항원은 오답이다", () => {
		const { outcome } = tapAntigen(twoVaccineGame(), ND);

		expect(outcome).toBe("wrong");
	});

	test("약어가 같아도 세부 타입이 다르면 오답이다", () => {
		const game = createGame([vaccine("a", [antigen("AI", { subtype: "Y280" })])], settings(), 60);

		expect(tapAntigen(game, antigen("AI")).outcome).toBe("wrong");
	});

	test("이미 모은 항원을 또 누르면 무시하고 점수와 콤보가 그대로다", () => {
		const collected = tapAntigen(twoVaccineGame(), HA).game;

		const { game, outcome } = tapAntigen(collected, HA);

		expect(outcome).toBe("ignored");
		expect(game.score).toBe(collected.score);
		expect(game.combo).toBe(collected.combo);
	});

	test("게임이 끝난 뒤에 누르면 무시한다", () => {
		const over = tickGame(twoVaccineGame(), 60_000);

		expect(tapAntigen(over, HA).outcome).toBe("ignored");
	});
});

describe("점수", () => {
	test("정답 하나에 100점을 더한다", () => {
		expect(tapAntigen(twoVaccineGame(), HA).game.score).toBe(SCORE.correct);
	});

	test("백신을 완성하면 완성 점수를 더하고 완성 수가 1 늘어난다", () => {
		const game = tapAll(twoVaccineGame(), [HA, NA]);

		expect(game.score).toBe(SCORE.correct * 2 + SCORE.complete);
		expect(game.completedCount).toBe(1);
	});

	test(`정답이 ${COMBO_START}번 이어지면 그때부터 콤보 점수를 더한다`, () => {
		const game = tapAll(twoVaccineGame(), [HA, NA, ND]);

		expect(game.combo).toBe(3);
		expect(game.score).toBe(SCORE.correct * 3 + SCORE.complete + SCORE.combo);
	});

	test("오답이면 콤보가 0으로 돌아간다", () => {
		const game = tapAll(twoVaccineGame(), [HA, ND]);

		expect(game.combo).toBe(0);
	});

	test("점수 패널티가 켜져 있으면 오답에 설정한 점수만큼 뺀다", () => {
		const penalty = {
			time: { isEnabled: false, seconds: 3 },
			score: { isEnabled: true, points: 50 },
		};
		const game = tapAll(twoVaccineGame(settings({ penalty })), [HA, ND]);

		expect(game.score).toBe(SCORE.correct - 50);
	});

	test("0점에서 오답이면 0점 그대로다", () => {
		const penalty = {
			time: { isEnabled: false, seconds: 3 },
			score: { isEnabled: true, points: 500 },
		};
		const game = tapAll(twoVaccineGame(settings({ penalty })), [ND]);

		expect(game.score).toBe(0);
	});

	test("점수 패널티가 꺼져 있으면 오답이어도 점수가 그대로다", () => {
		const game = tapAll(twoVaccineGame(), [HA, ND]);

		expect(game.score).toBe(SCORE.correct);
	});
});

describe("시간", () => {
	test("남은 시간은 게임 시간에서 흐른 시간을 뺀다", () => {
		const game = tickGame(twoVaccineGame(), 1500);

		expect(getRemainingMs(game)).toBe(58_500);
	});

	test("시간 패널티가 켜져 있으면 오답마다 설정한 초만큼 남은 시간이 준다", () => {
		const penalty = {
			time: { isEnabled: true, seconds: 3 },
			score: { isEnabled: false, points: 50 },
		};
		const game = tapAll(twoVaccineGame(settings({ penalty })), [ND, IB]);

		expect(getRemainingMs(game)).toBe(54_000);
	});

	test("남은 시간은 0 아래로 내려가지 않고, 0이 되면 게임이 끝난다", () => {
		const game = tickGame(twoVaccineGame(), 90_000);

		expect(getRemainingMs(game)).toBe(0);
		expect(isGameOver(game)).toBe(true);
	});

	test("시간이 남아 있으면 게임이 끝나지 않는다", () => {
		expect(isGameOver(tickGame(twoVaccineGame(), 59_999))).toBe(false);
	});
});

describe("백신 순서", () => {
	test("백신을 완성하면 다음 백신으로 넘어간다", () => {
		const game = tapAll(twoVaccineGame(), [HA, NA]);

		expect(getCurrentVaccine(game).id).toBe("b");
		expect(game.collectedKeys).toEqual([]);
	});

	test("마지막 백신을 완성하면 처음 백신부터 다시 만든다", () => {
		const game = tapAll(twoVaccineGame(), [HA, NA, ND, IB]);

		expect(getCurrentVaccine(game).id).toBe("a");
		expect(game.completedCount).toBe(2);
	});

	test("백신이 1개면 완성할 때마다 같은 백신을 다시 만든다", () => {
		const game = tapAll(createGame([vaccine("a", [HA])], settings(), 60), [HA, HA]);

		expect(game.completedCount).toBe(2);
		expect(getCurrentVaccine(game).id).toBe("a");
	});
});

describe("고정 항원", () => {
	const pinnedHa = antigen("HA", { isPinned: true });

	test("고정 항원은 이미 병에 담긴 상태로 시작한다", () => {
		const game = createGame([vaccine("a", [pinnedHa, NA])], settings(), 60);

		expect(getNeededAntigens(game).map((item) => item.abbr)).toEqual(["NA"]);
		expect(getBottleFill(game)).toBe(50);
	});

	test("고정 항원을 누르면 이미 담긴 항원이라 무시한다", () => {
		const game = createGame([vaccine("a", [pinnedHa, NA])], settings(), 60);

		expect(tapAntigen(game, HA).outcome).toBe("ignored");
	});

	test("다음 백신으로 넘어가도 그 백신의 고정 항원이 담긴 상태로 시작한다", () => {
		const pinnedNd = antigen("ND", { isPinned: true });
		const game = tapAll(
			createGame([vaccine("a", [HA]), vaccine("b", [pinnedNd, IB])], settings(), 60),
			[HA],
		);

		expect(getNeededAntigens(game).map((item) => item.abbr)).toEqual(["IB"]);
	});

	test("항원이 모두 고정된 백신은 건너뛴다", () => {
		const game = createGame([vaccine("a", [pinnedHa]), vaccine("b", [ND])], settings(), 60);

		expect(getCurrentVaccine(game).id).toBe("b");
	});

	test("모든 백신의 항원이 고정이면 필요한 항원이 없고 누르는 항원은 모두 오답이나 무시다", () => {
		const game = createGame([vaccine("a", [pinnedHa])], settings(), 60);

		expect(getNeededAntigens(game)).toEqual([]);
		expect(tapAntigen(game, ND).outcome).toBe("wrong");
	});
});

describe("병 채움", () => {
	test("담긴 항원 수를 필요한 항원 수로 나눈 비율이다", () => {
		const game = createGame([vaccine("a", [HA, NA, ND])], settings(), 60);

		expect(getBottleFill(tapAntigen(game, HA).game)).toBeCloseTo(100 / 3);
	});
});

describe("힌트", () => {
	test("힌트 시간 동안 정답이 없으면 힌트가 켜진다", () => {
		expect(isHintActive(tickGame(twoVaccineGame(), 5000))).toBe(true);
	});

	test("힌트 시간이 되기 전에는 켜지지 않는다", () => {
		expect(isHintActive(tickGame(twoVaccineGame(), 4999))).toBe(false);
	});

	test("정답을 고르면 그때부터 다시 센다", () => {
		const game = tickGame(tapAntigen(tickGame(twoVaccineGame(), 4000), HA).game, 4000);

		expect(isHintActive(game)).toBe(false);
	});

	test("오답은 힌트 시간을 다시 세지 않는다", () => {
		const game = tickGame(tapAntigen(tickGame(twoVaccineGame(), 4000), ND).game, 1000);

		expect(isHintActive(game)).toBe(true);
	});

	test("힌트 설정이 꺼져 있으면 켜지지 않는다", () => {
		const game = twoVaccineGame(settings({ hint: { isEnabled: false, delaySeconds: 5 } }));

		expect(isHintActive(tickGame(game, 30_000))).toBe(false);
	});
});

describe("결과", () => {
	test("점수와 이번 판에 나온 백신 전부를 돌려준다", () => {
		const result = getGameResult(tapAll(twoVaccineGame(), [HA, NA]));

		expect(result.score).toBe(SCORE.correct * 2 + SCORE.complete);
		expect(result.vaccines.map((item) => item.id)).toEqual(["a", "b"]);
	});

	test("정답이 하나도 없으면 전부 오답으로 본다", () => {
		expect(getGameResult(tapAll(twoVaccineGame(), [ND])).isAllWrong).toBe(true);
		expect(getGameResult(twoVaccineGame()).isAllWrong).toBe(true);
	});

	test("정답이 하나라도 있으면 전부 오답이 아니다", () => {
		expect(getGameResult(tapAll(twoVaccineGame(), [ND, HA])).isAllWrong).toBe(false);
	});
});

describe("받은 값", () => {
	test("게임 상태와 백신 목록을 바꾸지 않고 새 상태를 돌려준다", () => {
		const vaccines = deepFreeze([vaccine("a", [HA, NA]), vaccine("b", [ND, IB])]);
		const game = deepFreeze(createGame(vaccines, settings(), 60));

		const next = tickGame(tapAll(game, [HA, NA, ND]), 1000);

		expect(next).not.toBe(game);
		expect(game.score).toBe(0);
		expect(game.collectedKeys).toEqual([]);
	});
});

describe("목데이터로 한 판", () => {
	test("켜진 백신의 항원을 차례로 모두 모으면 백신 수만큼 완성한다", () => {
		const data = createMockData("filled")["vaccine-game"];
		const vaccines = data.vaccines.filter((item) => item.isEnabled);
		let game = createGame(vaccines, data.settings, 60);

		for (const item of vaccines) {
			game = tapAll(
				game,
				item.antigens.filter((entry) => !entry.isPinned),
			);
			game = tickGame(game, 1000);
		}

		expect(game.completedCount).toBe(
			vaccines.filter((item) => item.antigens.some((entry) => !entry.isPinned)).length,
		);
		expect(isGameOver(game)).toBe(false);
		expect(getGameResult(game).isAllWrong).toBe(false);
	});
});
