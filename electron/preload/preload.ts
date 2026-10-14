import { contextBridge, ipcRenderer } from "electron";
import type { ElectronApi } from "./api";

const TEMPORARY_PIN = "0000";

const api: ElectronApi = {
	getVersion: () => ipcRenderer.invoke("app:getVersion"),

	getData: (file) => ipcRenderer.invoke("data:get", file),
	updateData: (file, data) => ipcRenderer.invoke("data:update", file, data),

	postImage: async () => ({ status: "cancel" }),
	getImageUrl: () => "",

	verifyPin: async (pin) => pin === TEMPORARY_PIN,
	updatePin: async (current) =>
		current === TEMPORARY_PIN ? { isSuccess: true } : { isSuccess: false, reason: "wrong-current" },
};

contextBridge.exposeInMainWorld("api", api);
