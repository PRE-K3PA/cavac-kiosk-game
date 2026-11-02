import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

// vite.config.ts 도 가져다 쓰므로 Node 내장 모듈 말고는 import 하지 않습니다

const HASH_PREFIX = "scrypt";
// .env 파일은 $ 를 변수로 풀어 쓰므로 구분자로 쓰지 않습니다
const HASH_SEPARATOR = ":";
const SALT_BYTES = 16;
const KEY_BYTES = 32;
const PIN_HASH_PATTERN = new RegExp(
	`^${HASH_PREFIX}${HASH_SEPARATOR}[0-9a-f]{${SALT_BYTES * 2}}${HASH_SEPARATOR}[0-9a-f]{${KEY_BYTES * 2}}$`,
);

function deriveKey(pin: string, salt: Buffer): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		scrypt(pin, salt, KEY_BYTES, (error, key) => (error ? reject(error) : resolve(key)));
	});
}

export function isPinHash(value: string): boolean {
	return PIN_HASH_PATTERN.test(value);
}

export const RELEASE_MODE = "release";

/** 빌드할 때 넣을 마스터 PIN 해시를 검사하고, 문제가 있으면 사유를 돌려줍니다 */
export function findMasterPinHashError(masterPinHash: string, mode: string): string | undefined {
	if (masterPinHash === "") {
		return mode === RELEASE_MODE
			? "배포 빌드에는 MASTER_PIN_HASH 가 필요합니다. .env.local 을 확인해 주세요"
			: undefined;
	}
	return isPinHash(masterPinHash)
		? undefined
		: "MASTER_PIN_HASH 형식이 아닙니다. hash-pin 스크립트로 만든 값을 넣어 주세요";
}

export async function hashPin(pin: string): Promise<string> {
	const salt = randomBytes(SALT_BYTES);
	const key = await deriveKey(pin, salt);
	return [HASH_PREFIX, salt.toString("hex"), key.toString("hex")].join(HASH_SEPARATOR);
}

export async function matchesPinHash(pin: string, pinHash: string): Promise<boolean> {
	if (!isPinHash(pinHash)) return false;
	const [, saltHex, keyHex] = pinHash.split(HASH_SEPARATOR);
	const key = await deriveKey(pin, Buffer.from(saltHex, "hex"));
	return timingSafeEqual(key, Buffer.from(keyHex, "hex"));
}
