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

	async function readPinHash(fromPath: string): Promise<string | undefined> {
		try {
			const parsed: unknown = JSON.parse(await readFile(fromPath, "utf8"));
			if (typeof parsed !== "object" || parsed === null || !("pinHash" in parsed)) return undefined;
			const { pinHash } = parsed;
			return typeof pinHash === "string" && isPinHash(pinHash) ? pinHash : undefined;
		} catch {
			return undefined;
		}
	}

	// 파일이 없거나 깨졌으면 .bak 을, 그것도 없으면 초기 PIN 을 씁니다
	async function matchesSavedPin(pin: string): Promise<boolean> {
		const pinHash = (await readPinHash(filePath)) ?? (await readPinHash(backupPath));
		return pinHash ? matchesPinHash(pin, pinHash) : pin === DEFAULT_PIN;
	}

	async function matchesAnyPin(pin: string): Promise<boolean> {
		if (await matchesSavedPin(pin)) return true;
		return matchesPinHash(pin, masterPinHash);
	}

	async function savePin(pin: string): Promise<void> {
		await mkdir(dataDir, { recursive: true });
		if (await readPinHash(filePath)) {
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
