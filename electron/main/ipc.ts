import { BrowserWindow, dialog, ipcMain, type OpenDialogOptions } from "electron";
import { IMAGE_EXTENSIONS } from "@/data/schema";
import {
	DATA_FILES,
	type DataFile,
	IMAGE_KINDS,
	type ImageKind,
	type ImageResult,
	type PinChangeResult,
	type SaveResult,
} from "@/types/data";
import type { DataStore } from "./data-store";
import { importImage, removeUnusedImages } from "./images";
import { getDataDir, getImagesDir } from "./paths";
import type { PinStore } from "./pin";

function isDataFile(value: unknown): value is DataFile {
	return DATA_FILES.some((file) => file === value);
}

function isImageKind(value: unknown): value is ImageKind {
	return IMAGE_KINDS.some((kind) => kind === value);
}

const IMAGE_DIALOG_OPTIONS: OpenDialogOptions = {
	properties: ["openFile"],
	filters: [{ name: "이미지", extensions: [...IMAGE_EXTENSIONS] }],
};

export function registerIpcHandlers(dataStore: DataStore, pinStore: PinStore): void {
	ipcMain.handle("app:getVersion", () => process.env.npm_package_version ?? "0.0.0");

	ipcMain.handle("data:get", (_event, file: unknown) => {
		// 화면 코드가 잘못된 파일 이름을 넘긴 경우라 돌려줄 데이터가 없습니다
		if (!isDataFile(file)) throw new Error(`알 수 없는 데이터 파일입니다: ${String(file)}`);
		return dataStore.read(file);
	});

	ipcMain.handle("data:update", async (_event, file: unknown, data: unknown) => {
		if (!isDataFile(file)) {
			const failure: SaveResult<DataFile> = { isSuccess: false, reason: "io" };
			return failure;
		}
		const result = await dataStore.write(file, data);
		if (result.isSuccess) {
			await removeUnusedImages(getDataDir(), getImagesDir(), file);
		}
		return result;
	});

	ipcMain.handle("image:post", async (event, kind: unknown): Promise<ImageResult> => {
		if (!isImageKind(kind)) return { status: "error", reason: "io" };

		const window = BrowserWindow.fromWebContents(event.sender);
		const { canceled, filePaths } = window
			? await dialog.showOpenDialog(window, IMAGE_DIALOG_OPTIONS)
			: await dialog.showOpenDialog(IMAGE_DIALOG_OPTIONS);
		const [sourcePath] = filePaths;
		if (canceled || !sourcePath) return { status: "cancel" };

		return importImage(getImagesDir(), kind, sourcePath);
	});

	ipcMain.handle("pin:verify", (_event, pin: unknown) => {
		return typeof pin === "string" && pinStore.verify(pin);
	});

	ipcMain.handle(
		"pin:update",
		async (_event, current: unknown, next: unknown): Promise<PinChangeResult> => {
			if (typeof current !== "string" || typeof next !== "string") {
				return { isSuccess: false, reason: "io" };
			}
			return pinStore.update(current, next);
		},
	);
}
