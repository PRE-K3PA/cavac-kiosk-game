import type { Platform } from "@/types/data";

/** 설정 파일의 이미지 경로(images/...) 앞에 붙여 화면에서 쓰는 주소를 만듭니다 */
export const IMAGE_URL_SCHEME = "cavac";

export interface ElectronApi extends Platform {
	getVersion(): Promise<string>;
}

declare global {
	interface Window {
		api: ElectronApi;
	}
}
