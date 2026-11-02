import { describe, expect, test } from "bun:test";
import path from "node:path";
import { PORTABLE_DATA_DIR_NAME, resolveStorageRoot } from "./storage-root";

const USER_DATA = path.join("C:", "Users", "kiosk", "AppData", "Roaming", "CAVAC Kiosk");

describe("저장 폴더 위치", () => {
	test("포터블로 실행하면 exe 옆 폴더에 저장한다", () => {
		const usbDir = path.join("E:", "CAVAC");
		expect(resolveStorageRoot(usbDir, USER_DATA)).toBe(path.join(usbDir, PORTABLE_DATA_DIR_NAME));
	});

	test("설치형이나 개발 모드는 userData 에 저장한다", () => {
		expect(resolveStorageRoot(undefined, USER_DATA)).toBe(USER_DATA);
		expect(resolveStorageRoot("", USER_DATA)).toBe(USER_DATA);
	});
});
