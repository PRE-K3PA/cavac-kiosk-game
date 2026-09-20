import { ipcMain } from "electron";

export function registerIpcHandlers(): void {
	ipcMain.handle("app:getVersion", () => process.env.npm_package_version ?? "0.0.0");

	// TODO: 설정 읽기/쓰기, 제품 데이터 조회, 플레이 기록 저장
}
