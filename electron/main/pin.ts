import { copyFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { LIMITS } from "@/data/schema";
import type { PinChangeResult } from "@/types/data";
import { writeFileAtomically } from "./atomic-write";
import { hashPin, isPinHash, matchesPinHash } from "./pin-hash";
import { retryOnFileLock } from "./retry";

// 4자리 해시는 쉽게 대입해 풀리므로 저장소에 두지 않고 빌드할 때 vite.config.ts 가 넣습니다
// 빌드를 거치지 않는 테스트에서는 정의되지 않고, 비어 있으면 마스터 PIN 으로는 들어갈 수 없습니다
declare const __MASTER_PIN_HASH__: string | undefined;
export const MASTER_PIN_HASH = typeof __MASTER_PIN_HASH__ === "string" ? __MASTER_PIN_HASH__ : "";

const DEFAULT_PIN = "0000";
const PIN_PATTERN = new RegExp(`^\\d{${LIMITS.pinLength}}$`);

export function isValidPin(pin: string): boolean {
	return PIN_PATTERN.test(pin);
}

type PinFile =
	| { status: "valid"; pinHash: string }
	| { status: "missing" }
	| { status: "unreadable" };

export type PinStore = {
	verify(pin: string): Promise<boolean>;
	update(current: string, next: string): Promise<PinChangeResult>;
};

export function createPinStore(dataDir: string, masterPinHash: string): PinStore {
	const filePath = path.join(dataDir, "pin.json");
	const backupPath = `${filePath}.bak`;
	let queue: Promise<unknown> = Promise.resolve();

	function enqueue<T>(task: () => Promise<T>): Promise<T> {
		const result = queue.then(task);
		queue = result.catch(() => undefined);
		return result;
	}

	async function readPinFile(fromPath: string): Promise<PinFile> {
		let text: string;
		try {
			text = await retryOnFileLock(() => readFile(fromPath, "utf8"));
		} catch (error) {
			const isMissing = error instanceof Error && "code" in error && error.code === "ENOENT";
			return { status: isMissing ? "missing" : "unreadable" };
		}
		try {
			const parsed: unknown = JSON.parse(text);
			if (typeof parsed !== "object" || parsed === null || !("pinHash" in parsed)) {
				return { status: "unreadable" };
			}
			const { pinHash } = parsed;
			return typeof pinHash === "string" && isPinHash(pinHash)
				? { status: "valid", pinHash }
				: { status: "unreadable" };
		} catch {
			return { status: "unreadable" };
		}
	}

	// 초기 PIN 은 첫 실행(파일이 아예 없음)에만 받습니다
	// 파일이 있는데 깨졌거나 읽지 못하면 실수나 일시적인 오류로 0000 이 열리지 않도록 마스터 PIN 으로만 들어갑니다
	async function matchesSavedPin(pin: string): Promise<boolean> {
		const saved = await readPinFile(filePath);
		if (saved.status === "valid") return matchesPinHash(pin, saved.pinHash);

		const backup = await readPinFile(backupPath);
		if (backup.status === "valid") return matchesPinHash(pin, backup.pinHash);

		const isFirstRun = saved.status === "missing" && backup.status === "missing";
		return isFirstRun && pin === DEFAULT_PIN;
	}

	async function matchesAnyPin(pin: string): Promise<boolean> {
		if (await matchesSavedPin(pin)) return true;
		return matchesPinHash(pin, masterPinHash);
	}

	async function savePin(pin: string): Promise<void> {
		await mkdir(dataDir, { recursive: true });
		if ((await readPinFile(filePath)).status === "valid") {
			await retryOnFileLock(() => copyFile(filePath, backupPath));
		}
		const pinFile = { pinHash: await hashPin(pin) };
		await writeFileAtomically(filePath, `${JSON.stringify(pinFile, null, "\t")}\n`);
	}

	return {
		verify(pin) {
			return enqueue(() => matchesAnyPin(pin));
		},

		update(current, next) {
			return enqueue(async () => {
				if (!(await matchesAnyPin(current))) return { isSuccess: false, reason: "wrong-current" };
				// 화면에서 숫자 4자리만 받으므로 형식 오류 사유를 따로 두지 않고 저장 실패로 돌려줍니다
				if (!isValidPin(next)) return { isSuccess: false, reason: "io" };
				try {
					await savePin(next);
					return { isSuccess: true };
				} catch {
					return { isSuccess: false, reason: "io" };
				}
			});
		},
	};
}
