import { ipcMain } from "electron";
import { DATA_FILES, type DataFile, type SaveResult } from "@/types/data";
import { createDataStore } from "./data-store";
import { getDataDir } from "./paths";

function isDataFile(value: unknown): value is DataFile {
	return DATA_FILES.some((file) => file === value);
}

export function registerIpcHandlers(): void {
	const dataStore = createDataStore(getDataDir());

	ipcMain.handle("app:getVersion", () => process.env.npm_package_version ?? "0.0.0");

	ipcMain.handle("data:get", (_event, file: unknown) => {
		// 화면 코드가 잘못된 파일 이름을 넘긴 경우라 돌려줄 데이터가 없습니다
		if (!isDataFile(file)) throw new Error(`알 수 없는 데이터 파일입니다: ${String(file)}`);
		return dataStore.read(file);
	});

	ipcMain.handle("data:update", async (_event, file: unknown, data: unknown) => {
		const failure: SaveResult<DataFile> = { isSuccess: false, reason: "io" };
		return isDataFile(file) ? dataStore.write(file, data) : failure;
	});
}
