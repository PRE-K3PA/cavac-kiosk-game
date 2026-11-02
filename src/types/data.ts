// 저장 데이터와 Platform 계약
// 원본: Notion K3PA › 문서서식 › 데이터구조
// 필드를 바꾸면 Notion 문서, src/data/schema.ts, 목데이터를 함께 고칩니다

/** userData 기준 상대 경로. 형식은 images/<kind>/<uuid>.<png|jpg|jpeg> */
export type ImagePath = string;

export const IMAGE_KINDS = ["species", "vaccine-bottle", "vaccine-logo", "product"] as const;
export type ImageKind = (typeof IMAGE_KINDS)[number];

export type Localized<T> = {
	ko: T;
	en: T;
};

export type Language = keyof Localized<string>;

export const GAME_TYPES = ["vaccine", "card"] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const HOME_SLOTS = ["left-2", "left-1", "right-1", "right-2"] as const;
export type HomeSlot = (typeof HOME_SLOTS)[number];

// ---------------------------------------------------------------- common.json

export type Species = {
	id: string;
	name: string;
	character: ImagePath;
};

export type HomeAnimal = {
	speciesId: string;
	slot: HomeSlot;
};

export type CommonData = {
	activeGame: GameType;
	playDurationSeconds: number;
	autoReset: {
		isEnabled: boolean;
		idleSeconds: number;
	};
	species: Species[];
	homeAnimals: HomeAnimal[];
	volume: {
		bgmPercent: number;
		sfxPercent: number;
	};
};

// ---------------------------------------------------------- vaccine-game.json

export type Penalty = {
	time: {
		isEnabled: boolean;
		seconds: number;
	};
	score: {
		isEnabled: boolean;
		points: number;
	};
};

/** 항원의 병원체 종류. 화면 표기(이탤릭 등)를 나누는 데 씁니다 */
export const PATHOGEN_TYPES = ["bacteria", "virus"] as const;
export type PathogenType = (typeof PATHOGEN_TYPES)[number];

export type Antigen = {
	id: string;
	abbr: string;
	/** 세부 타입. "형" 없이 저장하고, 없으면 생략하지 않고 null */
	subtype: string | null;
	/** 세균인지 바이러스인지. 약어가 같으면 종류도 같아야 합니다 */
	pathogenType: PathogenType;
	isPinned: boolean;
};

// 항원 색은 저장하지 않습니다. 게임 시작 때 항원(약어 + 세부 타입)마다 정하고 그 판 동안 유지합니다
// 토큰은 globals.css 의 --color-antigen-01 ~ --color-antigen-25
export const ANTIGEN_COLOR_KEYS = [
	"01",
	"02",
	"03",
	"04",
	"05",
	"06",
	"07",
	"08",
	"09",
	"10",
	"11",
	"12",
	"13",
	"14",
	"15",
	"16",
	"17",
	"18",
	"19",
	"20",
	"21",
	"22",
	"23",
	"24",
	"25",
] as const;
export type AntigenColorKey = (typeof ANTIGEN_COLOR_KEYS)[number];

export type Vaccine = {
	id: string;
	brandName: Localized<string>;
	productName: Localized<string>;
	bottleImage: Localized<ImagePath>;
	logoImage: Localized<ImagePath>;
	isEnabled: boolean;
	antigens: Antigen[];
};

export type VaccineGameSettings = {
	fallSpeedPercent: number;
	maxAntigensOnScreen: number;
	hint: {
		isEnabled: boolean;
		delaySeconds: number;
	};
	penalty: Penalty;
};

export type VaccineGameData = {
	settings: VaccineGameSettings;
	vaccines: Vaccine[];
};

// ------------------------------------------------------------- card-game.json

export const PAIR_COUNTS = [6, 8, 10] as const;
export type PairCount = (typeof PAIR_COUNTS)[number];

export type ProductSlot = {
	slot: number;
	image: Localized<ImagePath> | null;
	isEnabled: boolean;
	isShownInResult: boolean;
};

export type CardGameData = {
	settings: {
		pairCount: PairCount;
		penalty: Penalty;
	};
	products: ProductSlot[];
};

// ------------------------------------------------------------------- Platform

export type DataMap = {
	common: CommonData;
	"vaccine-game": VaccineGameData;
	"card-game": CardGameData;
};

export type DataFile = keyof DataMap;

export const DATA_FILES = [
	"common",
	"vaccine-game",
	"card-game",
] as const satisfies readonly DataFile[];

export type SaveResult<F extends DataFile> =
	| { isSuccess: true; data: DataMap[F] }
	| { isSuccess: false; reason: "invalid"; issues: string[] }
	| { isSuccess: false; reason: "io" };

export type ImageResult =
	| { status: "ok"; path: ImagePath }
	| { status: "cancel" }
	| { status: "error"; reason: "format" | "size" | "io" };

export type PinChangeResult =
	| { isSuccess: true }
	| { isSuccess: false; reason: "wrong-current" | "io" };

/** preload 가 window.api 로 노출하는 데이터 함수. 개발 중에는 같은 모양의 mock 을 씁니다 */
export interface Platform {
	getData<F extends DataFile>(file: F): Promise<DataMap[F]>;
	updateData<F extends DataFile>(file: F, data: DataMap[F]): Promise<SaveResult<F>>;

	postImage(kind: ImageKind): Promise<ImageResult>;
	getImageUrl(path: ImagePath): string;

	verifyPin(pin: string): Promise<boolean>;
	updatePin(current: string, next: string): Promise<PinChangeResult>;

	/** 진행 중인 저장을 마친 뒤 앱을 닫습니다. 저장이 끝나기 전까지는 풀리지 않습니다 */
	quitApp(): Promise<void>;
}
