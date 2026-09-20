export function getAppVersion(): Promise<string> {
	return window.api.getVersion();
}
