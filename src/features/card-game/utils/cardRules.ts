import type { ImagePath, Localized, PairCount, Penalty, ProductSlot } from "@/types/data";

export const MATCH_SCORE = 100;
export const TIME_BONUS_PER_SECOND = 100;
export const WRONG_REVEAL_MS = 500;
// 카드가 많을수록 외울 시간을 더 줍니다
export const PREVIEW_COUNTDOWN_SECONDS = { 6: 3, 8: 5, 10: 7 } as const satisfies Record<
	PairCount,
	number
>;
// MemoryCard 의 뒤집힘 애니메이션(duration-400)과 같아야 합니다
export const CARD_FLIP_MS = 400;

export type CardStatus = "hidden" | "revealed" | "wrong" | "matched";

export type GameCard = {
	id: string;
	pairId: string;
	/** 자리표시 쌍이면 null */
	image: Localized<ImagePath> | null;
	status: CardStatus;
};

export type PlayState = {
	cards: GameCard[];
	score: number;
	remainingSeconds: number;
};

type Random = () => number;

function shuffle<T>(items: T[], random: Random): T[] {
	const shuffled = [...items];
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const target = Math.floor(random() * (index + 1));
		[shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
	}
	return shuffled;
}

type PairSource = { pairId: string; image: Localized<ImagePath> | null };

// 자리표시 쌍은 앞면이 모두 같은 로고라 관람객이 서로 구분할 수 없습니다.
// 그래서 모두 같은 pairId 를 주어, 자리표시 카드끼리는 어느 두 장을 골라도 정답이 되게 합니다
const PLACEHOLDER_PAIR_ID = "placeholder";

// 켜진 제품 중에서만 pairCount 쌍을 고르고, 모자라면 사진 없는 자리표시 쌍으로 채웁니다.
// 관리자 저장과 시작 버튼이 켜진 제품 수를 보장하지만, 저장 데이터를 못 읽어 기본값(제품 없음)이
// 되어도 판이 깨지지 않게 하기 위해서입니다. 꺼진 제품은 모자라도 쓰지 않습니다
function pickPairSources(
	products: ProductSlot[],
	pairCount: PairCount,
	random: Random,
): PairSource[] {
	const enabled = products.filter((product) => product.isEnabled && product.image !== null);
	const picked: PairSource[] = shuffle(enabled, random)
		.slice(0, pairCount)
		.map((product) => ({ pairId: `product-${product.slot}`, image: product.image }));

	for (let index = picked.length; index < pairCount; index += 1) {
		picked.push({ pairId: PLACEHOLDER_PAIR_ID, image: null });
	}
	return picked;
}

export function createDeck(
	products: ProductSlot[],
	pairCount: PairCount,
	random: Random = Math.random,
): GameCard[] {
	// 자리표시 쌍끼리는 pairId 가 같으므로, 카드 id 는 쌍의 순번으로 구분합니다
	const sources = pickPairSources(products, pairCount, random);
	const cards = sources.flatMap(({ pairId, image }, pairIndex) =>
		["a", "b"].map(
			(side): GameCard => ({
				id: `${pairId}-${pairIndex}-${side}`,
				pairId,
				image,
				status: "hidden",
			}),
		),
	);
	return shuffle(cards, random);
}

export function countMatchedPairs(cards: GameCard[]): number {
	return cards.filter((card) => card.status === "matched").length / 2;
}

export function isAllMatched(cards: GameCard[]): boolean {
	return cards.length > 0 && cards.every((card) => card.status === "matched");
}

export function hasWrongCards(cards: GameCard[]): boolean {
	return cards.some((card) => card.status === "wrong");
}

function setStatus(cards: GameCard[], ids: string[], status: CardStatus): GameCard[] {
	return cards.map((card) => (ids.includes(card.id) ? { ...card, status } : card));
}

function applyPenalty(state: PlayState, penalty: Penalty): PlayState {
	const { time, score } = penalty;
	return {
		...state,
		score: score.isEnabled ? Math.max(0, state.score - score.points) : state.score,
		remainingSeconds: time.isEnabled
			? Math.max(0, state.remainingSeconds - time.seconds)
			: state.remainingSeconds,
	};
}

export function hasPendingJudge(cards: GameCard[]): boolean {
	return cards.filter((card) => card.status === "revealed").length === 2;
}

/** 앞면으로만 바꿉니다. 판정은 뒤집힘이 끝난 뒤 judgePair 가 합니다. 잠금 중의 입력은 같은 state 를 돌려줍니다 */
export function selectCard(state: PlayState, cardId: string): PlayState {
	const target = state.cards.find((card) => card.id === cardId);
	if (target?.status !== "hidden") return state;
	if (hasWrongCards(state.cards) || hasPendingJudge(state.cards)) return state;
	return { ...state, cards: setStatus(state.cards, [cardId], "revealed") };
}

export function judgePair(state: PlayState, penalty: Penalty): PlayState {
	const pair = state.cards.filter((card) => card.status === "revealed");
	if (pair.length !== 2) return state;

	const ids = pair.map((card) => card.id);
	if (pair[0].pairId === pair[1].pairId) {
		return {
			...state,
			cards: setStatus(state.cards, ids, "matched"),
			score: state.score + MATCH_SCORE,
		};
	}
	return applyPenalty({ ...state, cards: setStatus(state.cards, ids, "wrong") }, penalty);
}

export function resolveWrong(state: PlayState): PlayState {
	const wrongIds = state.cards.filter((card) => card.status === "wrong").map((card) => card.id);
	return { ...state, cards: setStatus(state.cards, wrongIds, "hidden") };
}

/** 남은 시간은 화면 타이머처럼 올림해서 셉니다. 시간이 다 된 판은 0 입니다 */
export function timeBonus(remainingSeconds: number): number {
	return Math.ceil(Math.max(0, remainingSeconds)) * TIME_BONUS_PER_SECOND;
}

export function isRoundOver(state: PlayState): boolean {
	return state.remainingSeconds <= 0 || isAllMatched(state.cards);
}
