import { z } from "zod";
import {
	type CardGameData,
	type CommonData,
	type DataFile,
	type DataMap,
	GAME_TYPES,
	HOME_SLOTS,
	type ImageKind,
	PAIR_COUNTS,
	PATHOGEN_TYPES,
	type Penalty,
	type VaccineGameData,
} from "@/types/data";

// 파일 "모양" 검사. 앱 시작 때 읽은 파일이 쓸 수 있는 값인지 봅니다
// 첫 실행처럼 백신이 0개인 상태도 통과합니다. 저장 가능 여부는 src/data/rules.ts 가 봅니다

export const LIMITS = {
	playDurationSeconds: { min: 15, max: 60, step: 5 },
	idleSeconds: { min: 10, max: 600 },
	speciesName: { min: 1, max: 6 },
	homeAnimals: { max: 4 },
	fallSpeedPercent: { min: 50, max: 150 },
	maxAntigensOnScreen: { min: 5, max: 10 },
	hintDelaySeconds: { min: 1, max: 30 },
	penaltySeconds: { min: 1, max: 30 },
	penaltyPoints: { min: 1, max: 500 },
	enabledVaccines: { min: 1, max: 5 },
	antigensPerVaccine: { min: 1, max: 5 },
	antigenAbbr: { min: 1, max: 8 },
	productSlots: 12,
	pinLength: 4,
	imageMaxBytes: 10 * 1024 * 1024,
} as const;

const IMAGE_EXTENSIONS = "png|jpg|jpeg";

export function imagePathSchema(kind: ImageKind) {
	const pattern = new RegExp(`^images/${kind}/[0-9a-f-]{36}\\.(${IMAGE_EXTENSIONS})$`);
	return z.string().regex(pattern, `${kind} 이미지 경로 형식이 아닙니다`);
}

function localized<T extends z.ZodType>(schema: T) {
	return z.object({ ko: schema, en: schema });
}

function intInRange(range: { min: number; max: number }) {
	return z.number().int().min(range.min).max(range.max);
}

const idSchema = z.uuid();

export const penaltySchema: z.ZodType<Penalty> = z.object({
	time: z.object({
		isEnabled: z.boolean(),
		seconds: intInRange(LIMITS.penaltySeconds),
	}),
	score: z.object({
		isEnabled: z.boolean(),
		points: intInRange(LIMITS.penaltyPoints),
	}),
});

export const commonDataSchema: z.ZodType<CommonData> = z.object({
	activeGame: z.enum(GAME_TYPES),
	playDurationSeconds: intInRange(LIMITS.playDurationSeconds).multipleOf(
		LIMITS.playDurationSeconds.step,
	),
	autoReset: z.object({
		isEnabled: z.boolean(),
		idleSeconds: intInRange(LIMITS.idleSeconds),
	}),
	species: z.array(
		z.object({
			id: idSchema,
			name: z.string(),
			character: imagePathSchema("species"),
		}),
	),
	homeAnimals: z.array(
		z.object({
			speciesId: idSchema,
			slot: z.enum(HOME_SLOTS),
		}),
	),
});

export const vaccineGameDataSchema: z.ZodType<VaccineGameData> = z.object({
	settings: z.object({
		fallSpeedPercent: intInRange(LIMITS.fallSpeedPercent),
		maxAntigensOnScreen: intInRange(LIMITS.maxAntigensOnScreen),
		hint: z.object({
			isEnabled: z.boolean(),
			delaySeconds: intInRange(LIMITS.hintDelaySeconds),
		}),
		penalty: penaltySchema,
	}),
	vaccines: z.array(
		z.object({
			id: idSchema,
			brandName: localized(z.string()),
			productName: localized(z.string()),
			bottleImage: localized(imagePathSchema("vaccine-bottle")),
			logoImage: localized(imagePathSchema("vaccine-logo")),
			isEnabled: z.boolean(),
			antigens: z.array(
				z.object({
					id: idSchema,
					abbr: z.string(),
					subtype: z.string().nullable(),
					pathogenType: z.enum(PATHOGEN_TYPES),
					isPinned: z.boolean(),
				}),
			),
		}),
	),
});

export const cardGameDataSchema: z.ZodType<CardGameData> = z.object({
	settings: z.object({
		pairCount: z.union(PAIR_COUNTS.map((count) => z.literal(count))),
		penalty: penaltySchema,
	}),
	products: z
		.array(
			z.object({
				slot: z.number().int().min(1).max(LIMITS.productSlots),
				image: localized(imagePathSchema("product")).nullable(),
				isEnabled: z.boolean(),
				isShownInResult: z.boolean(),
			}),
		)
		.length(LIMITS.productSlots)
		.refine(
			(products) => new Set(products.map((product) => product.slot)).size === LIMITS.productSlots,
			"제품 칸 번호 1~12가 한 번씩 있어야 합니다",
		),
});

export const dataSchemas: { [F in DataFile]: z.ZodType<DataMap[F]> } = {
	common: commonDataSchema,
	"vaccine-game": vaccineGameDataSchema,
	"card-game": cardGameDataSchema,
};
