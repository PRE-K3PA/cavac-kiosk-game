import { describe, expect, test } from "bun:test";
import { retryOnFileLock } from "./retry";

const NO_DELAYS = [0, 0, 0];

function fileError(code: string): Error {
	return Object.assign(new Error(code), { code });
}

function failTimes(count: number, code: string) {
	let calls = 0;
	const task = async () => {
		calls += 1;
		if (calls <= count) throw fileError(code);
		return "done";
	};
	return { task, getCalls: () => calls };
}

describe("파일 잠금 재시도", () => {
	test.each(["EPERM", "EBUSY", "EACCES"])(
		"%s 로 두 번 실패해도 세 번째에 성공한다",
		async (code) => {
			const { task, getCalls } = failTimes(2, code);
			expect(await retryOnFileLock(task, NO_DELAYS)).toBe("done");
			expect(getCalls()).toBe(3);
		},
	);

	test("계속 잠겨 있으면 정해진 횟수만 시도하고 마지막 오류를 던진다", async () => {
		const { task, getCalls } = failTimes(Number.POSITIVE_INFINITY, "EBUSY");
		await expect(retryOnFileLock(task, NO_DELAYS)).rejects.toMatchObject({ code: "EBUSY" });
		expect(getCalls()).toBe(NO_DELAYS.length + 1);
	});

	test("잠금이 아닌 오류는 다시 시도하지 않는다", async () => {
		const { task, getCalls } = failTimes(1, "ENOENT");
		await expect(retryOnFileLock(task, NO_DELAYS)).rejects.toMatchObject({ code: "ENOENT" });
		expect(getCalls()).toBe(1);
	});
});
