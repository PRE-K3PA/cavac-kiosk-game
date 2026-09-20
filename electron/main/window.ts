import { existsSync } from "node:fs";
import path from "node:path";
import { BrowserWindow, powerSaveBlocker } from "electron";

const DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const IS_DEV = Boolean(DEV_SERVER_URL);

function resolvePreloadPath(): string {
	const candidates = ["preload.js", "preload.mjs"].map((file) =>
		path.join(import.meta.dirname, "..", "preload", file),
	);
	return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

export function createMainWindow(): BrowserWindow {
	const window = new BrowserWindow({
		width: 1920,
		height: 1080,
		backgroundColor: "#0f172a",
		kiosk: !IS_DEV,
		fullscreen: !IS_DEV,
		autoHideMenuBar: true,
		webPreferences: {
			preload: resolvePreloadPath(),
			contextIsolation: true,
			nodeIntegration: false,
			devTools: IS_DEV,
		},
	});

	powerSaveBlocker.start("prevent-display-sleep");
	window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

	if (DEV_SERVER_URL) {
		window.loadURL(DEV_SERVER_URL);
	} else {
		window.loadFile(path.join(import.meta.dirname, "..", "..", "dist", "index.html"));
	}

	return window;
}
