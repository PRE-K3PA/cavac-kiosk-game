import { describe, expect, test } from "bun:test";
import { createDefaultData } from "@/data/defaults";
import { readWithDefault } from "@/data/load";
import { createMockData } from "@/data/mock/mock-platform";
import type { DataFile, DataMap } from "@/types/data";

// mock.module 은 다른 테스트 파일로 새어 나가므로 storage 를 바꿔 끼우지 않고 읽기 함수를 넘겨 확인합니다
const stored = createMockData("filled");

function readStored<F extends DataFile>(file: F): Promise<DataMap[F]> {
	return Promise.resolve(stored[file]);
}

describe("readWithDefault", () => {
	test("읽은 값을 그대로 돌려준다", async () => {
		expect(await readWithDefault("common", readStored)).toBe(stored.common);
	});

	test("읽기가 실패하면 그 파일의 기본값을 돌려준다", async () => {
		const rejecting = () => Promise.reject(new Error("IPC 실패"));

		expect(await readWithDefault("card-game", rejecting)).toEqual(createDefaultData("card-game"));
	});

	test("Promise 를 돌려주기 전에 바로 예외가 나도 기본값을 돌려준다", async () => {
		const throwing = () => {
			throw new Error("Platform 을 찾을 수 없습니다");
		};

		expect(await readWithDefault("vaccine-game", throwing)).toEqual(
			createDefaultData("vaccine-game"),
		);
	});
});
