import type { Platform } from "@/types/data";

export interface ElectronApi extends Platform {
	getVersion(): Promise<string>;
}

declare global {
	interface Window {
		api: ElectronApi;
	}
}
