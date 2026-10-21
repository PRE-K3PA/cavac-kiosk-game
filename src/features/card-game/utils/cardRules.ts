import type { ImagePath, Localized, PairCount, Penalty, ProductSlot } from "@/types/data";

export const MATCH_SCORE = 100;
export const TIME_BONUS_PER_SECOND = 100;
export const WRONG_REVEAL_MS = 500;
export const PREVIEW_COUNTDOWN_SECONDS = 3;
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

// 설정한 쌍 수만큼 제품이 없어도 게임이 멈추지 않게, 항상 pairCount 쌍을 만듭니다.
// 제품이 모자라는 경우: 관리자가 쌍 수보다 적게 켰거나, 등록한 제품 자체가 적거나,
// 저장 데이터를 못 읽어 기본값(제품 없음)이 된 경우입니다.
// 채우는 순서: 1) 켜진 제품 2) 꺼져 있어도 사진이 있는 제품 3) 사진 없는 자리표시 쌍("IMG" 칸)
// TODO: 2) 는 관리자가 끈 제품이 게임에 나올 수 있어 의도와 다를 수 있다.
//       이 동작을 확인한 뒤 꺼진 제품을 쓰지 않고 바로 자리표시로 채울지 결정하고 추가 작업할 예정
function pickPairSources(
	products: ProductSlot[],
	pairCount: PairCount,
	random: Random,
): PairSource[] {
	const withImage = products.filter((product) => product.image !== null);
	const enabled = shuffle(
		withImage.filter((product) => product.isEnabled),
		random,
	);
	const disabled = shuffle(
		withImage.filter((product) => !product.isEnabled),
		random,
	);
	const picked: PairSource[] = [...enabled, ...disabled]
		.slice(0, pairCount)
		.map((product) => ({ pairId: `product-${product.slot}`, image: product.image }));

	for (let index = picked.length; index < pairCount; index += 1) {
		picked.push({ pairId: `placeholder-${index}`, image: null });
	}
	return picked;
}

export function createDeck(
	products: ProductSlot[],
	pairCount: PairCount,
	random: Random = Math.random,
): GameCard[] {
	const cards = pickPairSources(products, pairCount, random).flatMap(({ pairId, image }) =>
		["a", "b"].map(
			(side): GameCard => ({
				id: `${pairId}-${side}`,
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
