export interface ElectronApi {
	getVersion(): Promise<string>;
}

declare global {
	interface Window {
		api: ElectronApi;
	}
}
