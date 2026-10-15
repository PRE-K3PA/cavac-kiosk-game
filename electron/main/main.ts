import { app, BrowserWindow } from "electron";
import { createDataStore } from "./data-store";
import { handleImageProtocol, registerImageScheme } from "./image-protocol";
import { removeUnusedImagesOnStartup } from "./images";
import { registerIpcHandlers } from "./ipc";
import { ensureStorageDirs, getDataDir, getImagesDir } from "./paths";
import { createMainWindow } from "./window";

if (!app.requestSingleInstanceLock()) {
	app.quit();
}

registerImageScheme();

app.whenReady().then(() => {
	// 폴더를 만들지 못해도 창은 띄웁니다. 설정 파일 폴더는 저장할 때 다시 만듭니다
	try {
		ensureStorageDirs();
	} catch (error) {
		console.error("저장 폴더를 만들지 못했습니다", error);
	}
	const dataStore = createDataStore(getDataDir());
	handleImageProtocol();
	registerIpcHandlers(dataStore);
	createMainWindow();
	void removeUnusedImagesOnStartup(getImagesDir(), dataStore);

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
