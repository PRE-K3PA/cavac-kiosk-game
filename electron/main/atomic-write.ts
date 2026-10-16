import { open, rename } from "node:fs/promises";
import { retryOnFileLock } from "./retry";

/** .tmp 에 쓰고 디스크에 기록한 뒤 이름을 바꾸므로, 쓰는 도중 전원이 꺼져도 반쯤 쓴 파일이 남지 않습니다 */
export async function writeFileAtomically(filePath: string, text: string): Promise<void> {
	const temp = `${filePath}.tmp`;
	const handle = await open(temp, "w");
	try {
		await handle.writeFile(text, "utf8");
		await handle.sync();
	} finally {
		await handle.close();
	}
	await retryOnFileLock(() => rename(temp, filePath));
}
