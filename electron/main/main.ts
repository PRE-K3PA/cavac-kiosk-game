import { app, BrowserWindow } from "electron";
import { createDataStore } from "./data-store";
import { handleImageProtocol, registerImageScheme } from "./image-protocol";
import { removeAllUnusedImages } from "./images";
import { registerIpcHandlers } from "./ipc";
import { ensureStorageDirs, getDataDir, getDefaultSpeciesDir, getImagesDir } from "./paths";
import { createPinStore, MASTER_PIN_HASH } from "./pin";
import { seedDefaultSpecies } from "./seed";
import { createMainWindow } from "./window";

if (!app.requestSingleInstanceLock()) {
	app.quit();
}

registerImageScheme();

app.whenReady().then(async () => {
	// 폴더를 만들지 못해도 창은 띄웁니다. 설정 파일 폴더는 저장할 때 다시 만듭니다
	try {
		ensureStorageDirs();
	} catch (error) {
		console.error("저장 폴더를 만들지 못했습니다", error);
	}
	const dataStore = createDataStore(getDataDir());
	handleImageProtocol();
	registerIpcHandlers(dataStore, createPinStore(getDataDir(), MASTER_PIN_HASH));
	// 화면이 common.json 을 읽기 전에 기본 축종을 넣어 둡니다
	await seedDefaultSpecies({
		dataDir: getDataDir(),
		imagesDir: getImagesDir(),
		sourceDir: getDefaultSpeciesDir(),
		dataStore,
	}).catch((error) => console.error("기본 축종을 등록하지 못했습니다", error));
	createMainWindow();
	void removeAllUnusedImages(getDataDir(), getImagesDir());

	app.on("activate", () => {
		if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
	});
});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});
