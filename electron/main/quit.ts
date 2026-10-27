type Flushable = { flush(): Promise<void> };

/**
 * 저장 직후 종료를 눌러도 마지막 저장이 빠지지 않도록, 진행 중인 저장을 기다린 뒤 quit 을 부릅니다.
 * IPC 응답이 화면에 먼저 돌아가도록 quit 은 다음 차례로 미룹니다
 */
export async function quitAfterPendingWrites(
	stores: readonly Flushable[],
	quit: () => void,
): Promise<void> {
	await Promise.all(stores.map((store) => store.flush()));
	setImmediate(quit);
}
