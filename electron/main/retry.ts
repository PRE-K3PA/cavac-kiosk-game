import { setTimeout as sleep } from "node:timers/promises";

// Windows 에서는 백신이나 검색 색인이 방금 쓴 파일을 잠깐 잡고 있어 rename, copy 가 실패할 수 있습니다
const LOCK_ERROR_CODES = new Set(["EPERM", "EBUSY", "EACCES"]);
const RETRY_DELAYS_MS = [50, 100, 200, 400, 800];

function isLockError(error: unknown): boolean {
	return (
		error instanceof Error &&
		"code" in error &&
		typeof error.code === "string" &&
		LOCK_ERROR_CODES.has(error.code)
	);
}

/** 파일 잠금 오류일 때만 잠시 기다렸다 다시 시도합니다. 끝까지 실패하면 마지막 오류를 던집니다 */
export async function retryOnFileLock<T>(
	task: () => Promise<T>,
	delaysMs: readonly number[] = RETRY_DELAYS_MS,
): Promise<T> {
	for (const delayMs of delaysMs) {
		try {
			return await task();
		} catch (error) {
			if (!isLockError(error)) throw error;
		}
		await sleep(delayMs);
	}
	return task();
}
