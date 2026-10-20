import path from "node:path";

export const PORTABLE_DATA_DIR_NAME = "cavac-data";

/**
 * 설정과 사진을 둘 폴더. 포터블 exe 로 실행하면 electron-builder 가 exe 가 있는 폴더를
 * PORTABLE_EXECUTABLE_DIR 로 알려 주므로, 그 옆에 두어 USB 를 옮기면 설정도 함께 옮겨지게 합니다
 */
export function resolveStorageRoot(portableDir: string | undefined, userDataDir: string): string {
	return portableDir ? path.join(portableDir, PORTABLE_DATA_DIR_NAME) : userDataDir;
}
