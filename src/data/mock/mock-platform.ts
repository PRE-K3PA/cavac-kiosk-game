import { createDefaultData } from "@/data/defaults";
import cardGameMock from "@/data/mock/card-game.json";
import commonMock from "@/data/mock/common.json";
import vaccineGameMock from "@/data/mock/vaccine-game.json";
import { validateForSave } from "@/data/rules";
import { dataSchemas } from "@/data/schema";
import type {
	CommonData,
	DataFile,
	DataMap,
	ImageKind,
	ImagePath,
	ImageResult,
	Platform,
	VaccineGameData,
} from "@/types/data";

// 개발, 테스트 전용 Platform. Electron 없이 브라우저에서 화면을 붙여 볼 때 씁니다
// 배포본에는 들어가지 않습니다 (src/data/storage.ts 가 DEV 에서만 고릅니다)
//
// - filled: Figma 화면과 비슷하게 채운 상태
// - empty : 첫 실행 상태. 축종만 있고 백신 0개, 제품 빈 칸 12개
// - 저장한 값은 메모리에만 둡니다. 새로고침하면 처음 상태로 돌아갑니다
// - PIN 은 0000, 마스터 PIN 은 9999 (mock 전용 값)

export type MockScenario = "filled" | "empty";

export type MockPlatformOptions = {
	scenario?: MockScenario;
	/** updateData 가 io 실패를 돌려주게 합니다. 저장 실패 모달 확인용 */
	shouldFailSave?: boolean;
	/** 응답 지연(ms). 로딩 상태 확인용 */
	delayMs?: number;
};

const MOCK_MASTER_PIN = "9999";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
};

const filledData: DataMap = {
	common: commonMock as CommonData,
	"vaccine-game": vaccineGameMock as VaccineGameData,
	"card-game": cardGameMock as DataMap["card-game"],
};

export function createMockData(scenario: MockScenario): DataMap {
	if (scenario === "filled") return structuredClone(filledData);
	return {
		common: structuredClone(filledData.common),
		"vaccine-game": createDefaultData("vaccine-game"),
		"card-game": createDefaultData("card-game"),
	};
}

export function createMockPlatform(options: MockPlatformOptions = {}): Platform {
	const { scenario = "filled", shouldFailSave = false, delayMs = 0 } = options;
	const store = createMockData(scenario);
	const uploadedImages = new Map<ImagePath, string>();
	const imageLabels = collectImageLabels(store);
	let pin = "0000";

	function wait(): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, delayMs));
	}

	return {
		async getData<F extends DataFile>(file: F): Promise<DataMap[F]> {
			await wait();
			const parsed = dataSchemas[file].safeParse(store[file]);
			// 실제 main 처럼 깨진 값이면 기본값으로 복구합니다
			return structuredClone(parsed.success ? store[file] : createDefaultData(file));
		},

		async updateData(file, data) {
			await wait();
			if (shouldFailSave) return { isSuccess: false, reason: "io" };

			const result = validateForSave(file, data);
			if (!result.isValid) return { isSuccess: false, reason: "invalid", issues: result.issues };

			store[file] = structuredClone(result.data);
			return { isSuccess: true, data: structuredClone(result.data) };
		},

		async postImage(kind) {
			const result = await pickImageFile(kind);
			if (result.status === "ok") {
				uploadedImages.set(result.path, result.objectUrl);
				return { status: "ok", path: result.path };
			}
			return result;
		},

		getImageUrl(path) {
			return uploadedImages.get(path) ?? createPlaceholderUrl(path, imageLabels.get(path));
		},

		async verifyPin(input) {
			await wait();
			return input === pin || input === MOCK_MASTER_PIN;
		},

		async updatePin(current, next) {
			await wait();
			if (current !== pin && current !== MOCK_MASTER_PIN) {
				return { isSuccess: false, reason: "wrong-current" };
			}
			pin = next;
			return { isSuccess: true };
		},
	};
}

// ------------------------------------------------------------------ images

type PickResult =
	| Exclude<ImageResult, { status: "ok" }>
	| {
			status: "ok";
			path: ImagePath;
			objectUrl: string;
	  };

/** 브라우저 파일 선택 창으로 main 의 파일 대화상자를 흉내 냅니다 */
function pickImageFile(kind: ImageKind): Promise<PickResult> {
	return new Promise((resolve) => {
		const input = document.createElement("input");
		input.type = "file";
		input.accept = Object.keys(ACCEPTED_IMAGE_TYPES).join(",");
		input.addEventListener("cancel", () => resolve({ status: "cancel" }));
		input.addEventListener("change", () => {
			const file = input.files?.[0];
			if (!file) return resolve({ status: "cancel" });

			const extension = ACCEPTED_IMAGE_TYPES[file.type];
			if (!extension) return resolve({ status: "error", reason: "format" });
			if (file.size > MAX_IMAGE_BYTES) return resolve({ status: "error", reason: "size" });

			resolve({
				status: "ok",
				path: `images/${kind}/${crypto.randomUUID()}.${extension}`,
				objectUrl: URL.createObjectURL(file),
			});
		});
		input.click();
	});
}

const PLACEHOLDER_COLORS: Record<string, string> = {
	species: "#fde68a",
	"vaccine-bottle": "#bae6fd",
	"vaccine-logo": "#c7d2fe",
	product: "#bbf7d0",
};

/** 목데이터의 이미지 경로는 실제 파일이 없어서, 라벨을 적은 SVG 로 대신 보여 줍니다 */
function createPlaceholderUrl(path: ImagePath, label = "image"): string {
	const kind = path.split("/")[1] ?? "";
	const background = PLACEHOLDER_COLORS[kind] ?? "#e2e8f0";
	const svg = [
		'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">',
		`<rect width="256" height="256" rx="24" fill="${background}"/>`,
		'<text x="128" y="120" font-size="28" text-anchor="middle" fill="#334155">',
		`${escapeXml(label)}</text>`,
		'<text x="128" y="160" font-size="16" text-anchor="middle" fill="#64748b">',
		`${escapeXml(kind)}</text>`,
		"</svg>",
	].join("");
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function escapeXml(text: string): string {
	return text.replace(/[<>&"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function collectImageLabels(data: DataMap): Map<ImagePath, string> {
	const labels = new Map<ImagePath, string>();
	for (const species of data.common.species) {
		labels.set(species.character, species.name);
	}
	for (const vaccine of data["vaccine-game"].vaccines) {
		labels.set(vaccine.bottleImage.ko, `${vaccine.brandName.ko} 병`);
		labels.set(vaccine.bottleImage.en, `${vaccine.brandName.en} bottle`);
		labels.set(vaccine.logoImage.ko, `${vaccine.brandName.ko} 로고`);
		labels.set(vaccine.logoImage.en, `${vaccine.brandName.en} logo`);
	}
	for (const product of data["card-game"].products) {
		if (!product.image) continue;
		labels.set(product.image.ko, `제품 ${product.slot}`);
		labels.set(product.image.en, `Product ${product.slot}`);
	}
	return labels;
}
