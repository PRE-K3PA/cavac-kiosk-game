import { contextBridge, ipcRenderer } from "electron";
import { type ElectronApi, IMAGE_URL_SCHEME } from "./api";

const api: ElectronApi = {
	getVersion: () => ipcRenderer.invoke("app:getVersion"),

	getData: (file) => ipcRenderer.invoke("data:get", file),
	updateData: (file, data) => ipcRenderer.invoke("data:update", file, data),

	postImage: (kind) => ipcRenderer.invoke("image:post", kind),
	getImageUrl: (path) => `${IMAGE_URL_SCHEME}://${path}`,

	verifyPin: (pin) => ipcRenderer.invoke("pin:verify", pin),
	updatePin: (current, next) => ipcRenderer.invoke("pin:update", current, next),

	quitApp: () => ipcRenderer.invoke("app:quit"),
};

contextBridge.exposeInMainWorld("api", api);
