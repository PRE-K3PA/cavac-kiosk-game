import { createMockPlatform, type MockScenario } from "@/data/mock/mock-platform";
import type {
	DataFile,
	DataMap,
	ImageKind,
	ImagePath,
	ImageResult,
	PinChangeResult,
	Platform,
	SaveResult,
} from "@/types/data";

// window.api 를 직접 부르는 유일한 파일입니다. 화면 코드는 이 파일의 함수만 씁니다
// window.api 가 Platform 을 갖추지 않았을 때(브라우저로 열었을 때 등)는 개발 모드에서만 mock 을 씁니다
// mock 상태는 .env.local 의 VITE_MOCK_SCENARIO=filled|empty 로 바꿉니다

const PLATFORM_METHODS = [
	"getData",
	"updateData",
	"postImage",
	"getImageUrl",
	"verifyPin",
	"updatePin",
	"quitApp",
] as const satisfies readonly (keyof Platform)[];

function isPlatform(value: unknown): value is Platform {
	if (typeof value !== "object" || value === null) return false;
	return PLATFORM_METHODS.every(
		(method) => typeof (value as Record<string, unknown>)[method] === "function",
	);
}

function readMockScenario(): MockScenario {
	return import.meta.env.VITE_MOCK_SCENARIO === "empty" ? "empty" : "filled";
}

let platform: Platform | undefined;

function getPlatform(): Platform {
	if (platform) return platform;

	const api: unknown = typeof window === "undefined" ? undefined : window.api;
	if (isPlatform(api)) {
		platform = api;
	} else if (import.meta.env.DEV) {
		platform = createMockPlatform({ scenario: readMockScenario() });
	} else {
		throw new Error("Platform 을 찾을 수 없습니다. preload 연결을 확인하세요");
	}
	return platform;
}

export function getAppVersion(): Promise<string> {
	return window.api.getVersion();
}

export function getData<F extends DataFile>(file: F): Promise<DataMap[F]> {
	return getPlatform().getData(file);
}

export function updateData<F extends DataFile>(file: F, data: DataMap[F]): Promise<SaveResult<F>> {
	return getPlatform().updateData(file, data);
}

export function postImage(kind: ImageKind): Promise<ImageResult> {
	return getPlatform().postImage(kind);
}

export function getImageUrl(path: ImagePath): string {
	return getPlatform().getImageUrl(path);
}

export function verifyPin(pin: string): Promise<boolean> {
	return getPlatform().verifyPin(pin);
}

export function updatePin(current: string, next: string): Promise<PinChangeResult> {
	return getPlatform().updatePin(current, next);
}

export function quitApp(): Promise<void> {
	return getPlatform().quitApp();
}
