import { describe, expect, mock, test } from "bun:test";
import { quitAfterPendingWrites } from "./quit";

function nextTurn(): Promise<void> {
	return new Promise((resolve) => setImmediate(resolve));
}

function createPendingStore() {
	let finish = () => {};
	const done = new Promise<void>((resolve) => {
		finish = resolve;
	});
	return { store: { flush: () => done }, finish };
}

describe("앱 종료", () => {
	test("진행 중인 저장이 모두 끝난 뒤에 종료한다", async () => {
		const data = createPendingStore();
		const pin = createPendingStore();
		const quit = mock(() => {});

		const quitting = quitAfterPendingWrites([data.store, pin.store], quit);
		await nextTurn();
		expect(quit).not.toHaveBeenCalled();

		data.finish();
		await nextTurn();
		expect(quit).not.toHaveBeenCalled();

		pin.finish();
		await quitting;
		await nextTurn();
		expect(quit).toHaveBeenCalledTimes(1);
	});

	test("종료는 응답을 돌려준 다음 차례에 부른다", async () => {
		const quit = mock(() => {});

		await quitAfterPendingWrites([], quit);
		expect(quit).not.toHaveBeenCalled();

		await nextTurn();
		expect(quit).toHaveBeenCalledTimes(1);
	});
});
