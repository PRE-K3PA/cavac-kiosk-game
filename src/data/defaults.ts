import { DEFAULT_VOLUME, LIMITS } from "@/data/schema";
import type { CardGameData, CommonData, DataFile, DataMap, Penalty } from "@/types/data";

// 첫 실행 기본값. 파일이 없거나 깨졌을 때 main 이 이 값으로 복구합니다
// 수치는 Figma 화면 값을 따릅니다
// 기본 축종은 main 이 첫 실행 때 앱에 포함된 캐릭터 이미지를 복사하면서 채웁니다 (electron/main/seed.ts)

function createDefaultPenalty(): Penalty {
	return {
		time: { isEnabled: true, seconds: 3 },
		score: { isEnabled: false, points: 50 },
	};
}

function createEmptyProducts(): CardGameData["products"] {
	return Array.from({ length: LIMITS.productSlots }, (_, index) => ({
		slot: index + 1,
		image: null,
		isEnabled: false,
		isShownInResult: true,
	}));
}

export function createDefaultData<F extends DataFile>(file: F): DataMap[F] {
	const defaults: { [K in DataFile]: () => DataMap[K] } = {
		common: (): CommonData => ({
			activeGame: "vaccine",
			playDurationSeconds: 60,
			autoReset: { isEnabled: true, idleSeconds: 60 },
			species: [],
			homeAnimals: [],
			volume: { ...DEFAULT_VOLUME },
		}),
		"vaccine-game": () => ({
			settings: {
				fallSpeedPercent: 100,
				maxAntigensOnScreen: 7,
				hint: { isEnabled: true, delaySeconds: 5 },
				penalty: createDefaultPenalty(),
			},
			vaccines: [],
		}),
		"card-game": () => ({
			settings: { pairCount: 8, penalty: createDefaultPenalty() },
			products: createEmptyProducts(),
		}),
	};
	return defaults[file]();
}
