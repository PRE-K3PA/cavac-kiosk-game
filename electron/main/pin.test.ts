import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createPinStore, isValidPin } from "./pin";
import { hashPin, isPinHash, matchesPinHash } from "./pin-hash";

const NO_MASTER = "";

let dataDir: string;

beforeEach(async () => {
	dataDir = await mkdtemp(path.join(tmpdir(), "cavac-pin-"));
});

afterEach(async () => {
	await rm(dataDir, { recursive: true, force: true });
});

function readPinFile(name = "pin.json"): Promise<string> {
	return readFile(path.join(dataDir, name), "utf8");
}

describe("PIN 해시", () => {
	test("같은 PIN 이어도 salt 가 달라 해시가 다르고, 둘 다 원래 PIN 과 맞는다", async () => {
		const [first, second] = await Promise.all([hashPin("1234"), hashPin("1234")]);
		expect(first).not.toBe(second);
		expect(await matchesPinHash("1234", first)).toBe(true);
		expect(await matchesPinHash("1234", second)).toBe(true);
	});

	test("다른 PIN 이나 모양이 틀린 해시는 맞지 않는다", async () => {
		const pinHash = await hashPin("1234");
		expect(await matchesPinHash("4321", pinHash)).toBe(false);
		expect(await matchesPinHash("1234", "")).toBe(false);
		expect(await matchesPinHash("1234", "scrypt:00:11")).toBe(false);
		expect(await matchesPinHash("1234", pinHash.replace("scrypt", "md5"))).toBe(false);
	});

	test("해시 모양은 scrypt:<salt 32자>:<key 64자> 소문자 16진수만 받는다", async () => {
		const pinHash = await hashPin("1234");
		expect(isPinHash(pinHash)).toBe(true);
		expect(isPinHash(`${pinHash}:junk`)).toBe(false);
		expect(isPinHash(`x${pinHash}`)).toBe(false);
		expect(isPinHash(`scrypt:${pinHash.slice("scrypt:".length).toUpperCase()}`)).toBe(false);
		expect(isPinHash(pinHash.replace(/^scrypt:./, "scrypt:z"))).toBe(false);
		expect(isPinHash(pinHash.replace(/.$/, "z"))).toBe(false);
		expect(isPinHash(pinHash.slice(0, -2))).toBe(false);
		expect(await matchesPinHash("1234", `${pinHash}:junk`)).toBe(false);
	});

	test.each(["0000", "9876"])("숫자 4자리는 PIN 형식이다: %s", (pin) => {
		expect(isValidPin(pin)).toBe(true);
	});

	test.each(["", "123", "12345", "12a4", " 1234", "١٢٣٤"])("PIN 형식이 아니다: '%s'", (pin) => {
		expect(isValidPin(pin)).toBe(false);
	});
});

describe("PIN 확인과 변경", () => {
	test("첫 실행에는 0000 으로 들어갈 수 있다", async () => {
		const store = createPinStore(dataDir, NO_MASTER);
		expect(await store.verify("0000")).toBe(true);
		expect(await store.verify("1234")).toBe(false);
	});

	test("PIN 을 바꾸면 앱을 다시 켜도(새 store) 새 PIN 으로만 들어간다", async () => {
		expect(await createPinStore(dataDir, NO_MASTER).update("0000", "1234")).toEqual({
			isSuccess: true,
		});

		const restarted = createPinStore(dataDir, NO_MASTER);
		expect(await restarted.verify("1234")).toBe(true);
		expect(await restarted.verify("0000")).toBe(false);
	});

	test("저장된 파일에 PIN 원문이 없다", async () => {
		await createPinStore(dataDir, NO_MASTER).update("0000", "5824");
		const saved = await readPinFile();
		expect(saved).not.toContain("5824");
		expect(JSON.parse(saved).pinHash).toStartWith("scrypt:");
	});

	test("현재 PIN 이 틀리면 wrong-current 이고 바꾸지 않는다", async () => {
		const store = createPinStore(dataDir, NO_MASTER);
		expect(await store.update("1111", "1234")).toEqual({
			isSuccess: false,
			reason: "wrong-current",
		});
		expect(await store.verify("0000")).toBe(true);
	});

	test("새 PIN 이 숫자 4자리가 아니면 io 이고 바꾸지 않는다", async () => {
		const store = createPinStore(dataDir, NO_MASTER);
		expect(await store.update("0000", "12ab")).toEqual({ isSuccess: false, reason: "io" });
		expect(await store.verify("0000")).toBe(true);
	});

	test("마스터 PIN 으로 들어가서 PIN 을 다시 정할 수 있다", async () => {
		const store = createPinStore(dataDir, await hashPin("9999"));
		await store.update("0000", "1234");

		expect(await store.verify("9999")).toBe(true);
		expect(await store.update("9999", "4321")).toEqual({ isSuccess: true });
		expect(await store.verify("4321")).toBe(true);
		expect(await store.verify("1234")).toBe(false);
	});

	test("마스터 PIN 해시가 비어 있으면 마스터 PIN 으로 들어갈 수 없다", async () => {
		const store = createPinStore(dataDir, NO_MASTER);
		expect(await store.verify("")).toBe(false);
		expect(await store.verify("9999")).toBe(false);
	});

	test("pin.json 이 깨지면 .bak 의 PIN 을 쓴다", async () => {
		const store = createPinStore(dataDir, NO_MASTER);
		await store.update("0000", "1234");
		await store.update("1234", "5678");
		await writeFile(path.join(dataDir, "pin.json"), "{ 깨진 파일");

		expect(await store.verify("1234")).toBe(true);
		expect(await store.verify("0000")).toBe(false);
	});

	test("pin.json 의 해시 모양이 틀리면 깨진 파일로 보고 .bak 의 PIN 을 쓴다", async () => {
		const store = createPinStore(dataDir, NO_MASTER);
		await store.update("0000", "1234");
		await store.update("1234", "5678");
		await writeFile(path.join(dataDir, "pin.json"), JSON.stringify({ pinHash: "x" }));

		expect(await store.verify("1234")).toBe(true);
	});

	test("pin.json 과 .bak 이 모두 깨지면 0000 으로 들어간다", async () => {
		await writeFile(path.join(dataDir, "pin.json"), JSON.stringify({ pinHash: "x" }));
		await writeFile(path.join(dataDir, "pin.json.bak"), "{ 깨진 파일");

		expect(await createPinStore(dataDir, NO_MASTER).verify("0000")).toBe(true);
	});

	test("깨진 pin.json 이 멀쩡한 .bak 을 덮지 않는다", async () => {
		const store = createPinStore(dataDir, NO_MASTER);
		await store.update("0000", "1234");
		await store.update("1234", "5678");
		const backup = await readPinFile("pin.json.bak");
		await writeFile(path.join(dataDir, "pin.json"), JSON.stringify({ pinHash: "x" }));

		expect(await store.update("1234", "2468")).toEqual({ isSuccess: true });
		expect(await readPinFile("pin.json.bak")).toBe(backup);
	});

	test("동시에 바꿔도 차례로 처리해서 마지막 PIN 이 남는다", async () => {
		const store = createPinStore(dataDir, NO_MASTER);
		const results = await Promise.all([
			store.update("0000", "1111"),
			store.update("1111", "2222"),
			store.update("2222", "3333"),
		]);

		expect(results).toEqual([{ isSuccess: true }, { isSuccess: true }, { isSuccess: true }]);
		expect(await store.verify("3333")).toBe(true);
	});

	test("쓸 수 없는 위치면 예외 대신 io 를 돌려준다", async () => {
		const blocked = path.join(dataDir, "not-a-dir");
		await writeFile(blocked, "");
		expect(await createPinStore(blocked, NO_MASTER).update("0000", "1234")).toEqual({
			isSuccess: false,
			reason: "io",
		});
	});
});
