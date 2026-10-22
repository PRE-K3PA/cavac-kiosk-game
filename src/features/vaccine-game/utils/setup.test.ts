import { describe, expect, test } from "bun:test";
import { createDefaultData } from "@/data/defaults";
import { createMockData } from "@/data/mock/mock-platform";
import { type DataReader, loadSetup } from "@/features/vaccine-game/utils/setup";
import type { DataFile, DataMap } from "@/types/data";

const filled = createMockData("filled");

function readFilled<F extends DataFile>(file: F): Promise<DataMap[F]> {
	return Promise.resolve(filled[file]);
}

describe("loadSetup", () => {
	test("설정을 읽으면 켜진 백신과 설정, 제한 시간을 돌려준다", async () => {
		const setup = await loadSetup(readFilled);

		const enabledIds = filled["vaccine-game"].vaccines
			.filter((vaccine) => vaccine.isEnabled)
			.map((vaccine) => vaccine.id);
		expect(setup.round.map((vaccine) => vaccine.id)).toEqual(enabledIds);
		expect(setup.allVaccines).toEqual(filled["vaccine-game"].vaccines);
		expect(setup.settings).toEqual(filled["vaccine-game"].settings);
		expect(setup.playDurationSeconds).toBe(filled.common.playDurationSeconds);
	});

	test("데이터를 읽는 함수가 바로 예외를 던져도 기본값으로 진행한다", async () => {
		const throwing: DataReader = () => {
			throw new Error("Platform 을 찾을 수 없습니다");
		};

		const setup = await loadSetup(throwing);

		expect(setup.round).toEqual([]);
		expect(setup.settings).toEqual(createDefaultData("vaccine-game").settings);
		expect(setup.playDurationSeconds).toBe(createDefaultData("common").playDurationSeconds);
	});

	test("한 파일만 실패하면 그 파일만 기본값을 쓴다", async () => {
		const common = { ...filled.common, playDurationSeconds: 45 };
		const failVaccineGame: DataReader = <F extends DataFile>(file: F) =>
			file === "vaccine-game"
				? Promise.reject(new Error("깨진 파일"))
				: Promise.resolve((file === "common" ? common : filled[file]) as DataMap[F]);

		const setup = await loadSetup(failVaccineGame);

		expect(setup.round).toEqual([]);
		expect(setup.playDurationSeconds).toBe(45);
	});
});
