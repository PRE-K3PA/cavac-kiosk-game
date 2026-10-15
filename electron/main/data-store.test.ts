import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDefaultData } from "@/data/defaults";
import { createMockData } from "@/data/mock/mock-platform";
import { createDataStore } from "./data-store";

let dataDir: string;

beforeEach(async () => {
	dataDir = await mkdtemp(path.join(tmpdir(), "cavac-data-"));
});

afterEach(async () => {
	await rm(dataDir, { recursive: true, force: true });
});

function filePath(name: string): string {
	return path.join(dataDir, name);
}

async function readJson(name: string): Promise<unknown> {
	return JSON.parse(await readFile(filePath(name), "utf8"));
}

async function findCorruptFiles(file: string): Promise<string[]> {
	return (await readdir(dataDir)).filter((name) => name.startsWith(`${file}.json.corrupt-`));
}

describe("읽기", () => {
	test("파일이 없으면 기본값을 돌려주고 파일로 남긴다", async () => {
		const data = await createDataStore(dataDir).read("card-game");
		expect(data).toEqual(createDefaultData("card-game"));
		expect(await readJson("card-game.json")).toEqual(data);
	});

	test("원본이 깨지면 .bak 으로 복구하고 원본을 다시 쓴다", async () => {
		const backup = createMockData("filled")["vaccine-game"];
		await writeFile(filePath("vaccine-game.json"), "{ 깨진 파일");
		await writeFile(filePath("vaccine-game.json.bak"), JSON.stringify(backup));

		const data = await createDataStore(dataDir).read("vaccine-game");
		expect(data).toEqual(backup);
		expect(await readJson("vaccine-game.json")).toEqual(backup);
		expect(await readJson("vaccine-game.json.bak")).toEqual(backup);
	});

	test("원본이 없고 .bak 만 있으면 .bak 으로 복구한다", async () => {
		const backup = createMockData("filled").common;
		await writeFile(filePath("common.json.bak"), JSON.stringify(backup));

		const data = await createDataStore(dataDir).read("common");
		expect(data).toEqual(backup);
		expect(await readJson("common.json")).toEqual(backup);
	});

	test("쓸 수 없는 원본은 지우지 않고 .corrupt 파일로 남긴다", async () => {
		const unreadable = JSON.stringify({
			...createMockData("filled").common,
			playDurationSeconds: 62,
		});
		await writeFile(filePath("common.json"), unreadable);

		await createDataStore(dataDir).read("common");
		const corruptFiles = await findCorruptFiles("common");
		expect(corruptFiles).toHaveLength(1);
		expect(await readFile(filePath(corruptFiles[0]), "utf8")).toBe(unreadable);
	});

	test("원본과 .bak 이 모두 쓸 수 없는 값이면 기본값으로 복구한다", async () => {
		await writeFile(filePath("common.json"), JSON.stringify({ activeGame: "unknown" }));
		await writeFile(filePath("common.json.bak"), "");

		const data = await createDataStore(dataDir).read("common");
		expect(data).toEqual(createDefaultData("common"));
	});
});

describe("쓰기", () => {
	test("저장한 값은 앱을 다시 켜도(새 store) 남아 있다", async () => {
		const data = createMockData("filled")["vaccine-game"];
		data.settings.fallSpeedPercent = 120;

		const result = await createDataStore(dataDir).write("vaccine-game", data);
		expect(result.isSuccess).toBe(true);
		const reread = await createDataStore(dataDir).read("vaccine-game");
		expect(reread.settings.fallSpeedPercent).toBe(120);
	});

	test("저장하면 이전 원본이 .bak 으로 남고 .tmp 는 남지 않는다", async () => {
		const store = createDataStore(dataDir);
		const first = createMockData("filled").common;
		const second = { ...first, playDurationSeconds: 30 };

		await store.write("common", first);
		await store.write("common", second);
		expect(await readJson("common.json")).toEqual(second);
		expect(await readJson("common.json.bak")).toEqual(first);
		expect(existsSync(filePath("common.json.tmp"))).toBe(false);
	});

	test("저장 규칙에 걸리면 파일을 바꾸지 않고 invalid 와 사유를 돌려준다", async () => {
		const store = createDataStore(dataDir);
		const saved = createMockData("filled")["vaccine-game"];
		await store.write("vaccine-game", saved);

		const invalid = structuredClone(saved);
		for (const antigen of invalid.vaccines[1].antigens) antigen.isPinned = true;
		const result = await store.write("vaccine-game", invalid);

		expect(result).toMatchObject({ isSuccess: false, reason: "invalid" });
		if (!result.isSuccess && result.reason === "invalid") {
			expect(result.issues.length).toBeGreaterThan(0);
		}
		expect(await readJson("vaccine-game.json")).toEqual(saved);
	});

	test("원본이 깨진 상태에서 저장해도 멀쩡한 .bak 은 덮지 않는다", async () => {
		const backup = createMockData("filled").common;
		await writeFile(filePath("common.json"), "{ 깨진 파일");
		await writeFile(filePath("common.json.bak"), JSON.stringify(backup));

		const next = { ...backup, playDurationSeconds: 30 };
		await createDataStore(dataDir).write("common", next);
		expect(await readJson("common.json")).toEqual(next);
		expect(await readJson("common.json.bak")).toEqual(backup);
	});

	test("쓸 수 없는 위치면 예외 대신 io 를 돌려준다", async () => {
		const blocked = filePath("not-a-dir");
		await writeFile(blocked, "");

		const result = await createDataStore(blocked).write("common", createMockData("filled").common);
		expect(result).toEqual({ isSuccess: false, reason: "io" });
	});

	test("동시에 저장해도 파일이 섞이지 않고 마지막 값이 남는다", async () => {
		const store = createDataStore(dataDir);
		const base = createMockData("filled").common;
		const durations = [15, 20, 25, 30, 35];

		const results = await Promise.all(
			durations.map((seconds) => store.write("common", { ...base, playDurationSeconds: seconds })),
		);
		expect(results.every((result) => result.isSuccess)).toBe(true);
		expect(await readJson("common.json")).toMatchObject({ playDurationSeconds: 35 });
	});
});
