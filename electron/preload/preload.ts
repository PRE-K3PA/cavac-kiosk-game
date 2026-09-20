import { contextBridge, ipcRenderer } from "electron";
import type { ElectronApi } from "./api";

const api: ElectronApi = {
	getVersion: () => ipcRenderer.invoke("app:getVersion"),
};

contextBridge.exposeInMainWorld("api", api);
