import { contextBridge, ipcRenderer } from "electron";
import { type ElectronApi, IMAGE_URL_SCHEME } from "./api";

const TEMPORARY_PIN = "0000";

const api: ElectronApi = {
	getVersion: () => ipcRenderer.invoke("app:getVersion"),

	getData: (file) => ipcRenderer.invoke("data:get", file),
	updateData: (file, data) => ipcRenderer.invoke("data:update", file, data),

	postImage: (kind) => ipcRenderer.invoke("image:post", kind),
	getImageUrl: (path) => `${IMAGE_URL_SCHEME}://${path}`,

	verifyPin: async (pin) => pin === TEMPORARY_PIN,
	updatePin: async (current) =>
		current === TEMPORARY_PIN ? { isSuccess: true } : { isSuccess: false, reason: "wrong-current" },
};

contextBridge.exposeInMainWorld("api", api);
