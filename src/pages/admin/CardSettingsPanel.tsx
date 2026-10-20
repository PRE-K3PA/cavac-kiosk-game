import { Fragment, useEffect, useState } from "react";
import FieldMessage from "@/components/admin/FieldMessage";
import InlineNotice from "@/components/admin/InlineNotice";
import OptionButton from "@/components/admin/OptionButton";
import PenaltyRow from "@/components/admin/PenaltyRow";
import ProductRow from "@/components/admin/ProductRow";
import SectionHeader from "@/components/admin/SectionHeader";
import { LIMITS } from "@/data/schema";
import { getImageUrl } from "@/data/storage";
import { getLimitNotice, getUsageNotice } from "@/features/admin/cardSettings";
import {
	getPenaltyErrorMessage,
	getPenaltyInputValue,
	PENALTY_LIMITS,
	PENALTY_ROWS,
	type PenaltyKey,
	setPenaltyEnabled,
	setPenaltyValue,
} from "@/features/admin/penaltySettings";
import {
	changePairCount,
	countEnabledProducts,
	disableProduct,
	enableProduct,
	setShownInResult,
} from "@/features/admin/productSlots";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { useOrientation } from "@/layout/OrientationContext";
import { type CardGameData, PAIR_COUNTS, type PairCount, type Penalty } from "@/types/data";
import { cn } from "@/utils/cn";

const LAYOUT = {
	landscape: {
		panel: "flex-row",
		sideColumn: "w-140 shrink-0 gap-4",
		pairOption: "w-41",
	},
	portrait: {
		panel: "flex-col",
		sideColumn: "gap-6",
		pairOption: "flex-1",
	},
} as const;

const SECTION_CARD_CLASS =
	"flex rounded-2xl border-2 border-border-default bg-background-surface p-5";

const LIMIT_NOTICE_MS = 3000;

export default function CardSettingsPanel() {
	// 더 켜려 할 때마다 값을 바꿔 안내 줄의 표시 시간을 처음부터 다시 셉니다
	const [limitNoticeId, setLimitNoticeId] = useState<number | null>(null);
	const layout = LAYOUT[useOrientation()];

	const card = useSettingsDraft((state) => state.draft["card-game"]);
	const originalPenalty = useSettingsDraft((state) => state.original["card-game"].settings.penalty);
	const setDraft = useSettingsDraft((state) => state.setDraft);
	const { pairCount, penalty } = card.settings;

	function hideLimitNoticeLater() {
		if (limitNoticeId === null) return;

		function hideLimitNotice() {
			setLimitNoticeId(null);
		}

		const timer = setTimeout(hideLimitNotice, LIMIT_NOTICE_MS);
		return function cancelHide() {
			clearTimeout(timer);
		};
	}

	useEffect(hideLimitNoticeLater, [limitNoticeId]);

	const notice =
		getUsageNotice(card) ?? (limitNoticeId === null ? null : getLimitNotice(pairCount));

	function updateCard(next: CardGameData) {
		setDraft("card-game", next);
	}

	function updatePenalty(next: Penalty) {
		updateCard({ ...card, settings: { ...card.settings, penalty: next } });
	}

	function handlePairCountClick(count: PairCount) {
		setLimitNoticeId(null);
		updateCard(changePairCount(card, count));
	}

	function handlePenaltyCheckedChange(key: PenaltyKey, isEnabled: boolean) {
		updatePenalty(setPenaltyEnabled(penalty, originalPenalty, key, isEnabled));
	}

	function handlePenaltyValueChange(key: PenaltyKey, value: number | null) {
		updatePenalty(setPenaltyValue(penalty, key, value));
	}

	function handleProductEnabledChange(slot: number, isEnabled: boolean) {
		if (!isEnabled) {
			setLimitNoticeId(null);
			updateCard(disableProduct(card, slot));
			return;
		}

		const result = enableProduct(card, slot);
		if (result.isSuccess) {
			updateCard(result.data);
			return;
		}
		if (result.reason === "limit") setLimitNoticeId((id) => (id ?? 0) + 1);
	}

	function handleProductShownInResultChange(slot: number, isShownInResult: boolean) {
		updateCard(setShownInResult(card, slot, isShownInResult));
	}

	return (
		<div className={cn("flex h-full gap-6", layout.panel)}>
			<div className={cn("flex flex-col", layout.sideColumn)}>
				<section className={cn(SECTION_CARD_CLASS, "flex-col gap-3")}>
					<SectionHeader
						tone="card"
						title="카드 쌍 수"
						description="게임에 쓸 카드 쌍 수를 고르세요."
					/>
					<div className="flex gap-2">
						{PAIR_COUNTS.map((count) => (
							<OptionButton
								key={count}
								label={`${count}쌍`}
								sublabel={`카드 ${count * 2}장`}
								isSelected={count === pairCount}
								onClick={() => handlePairCountClick(count)}
								className={cn("h-24", layout.pairOption)}
							/>
						))}
					</div>
				</section>

				<section className={cn(SECTION_CARD_CLASS, "flex-col gap-3")}>
					<SectionHeader
						tone="card"
						title="오답 패널티"
						description="시간 차감과 점수 차감을 따로 켜고 끌 수 있습니다."
					/>
					{PENALTY_ROWS.map(({ key, label, unit }) => {
						const isChecked = penalty[key].isEnabled;
						const errorMessage = getPenaltyErrorMessage(penalty, key);
						return (
							<Fragment key={key}>
								<PenaltyRow
									label={label}
									unit={unit}
									isChecked={isChecked}
									value={getPenaltyInputValue(penalty, key)}
									maxLength={String(PENALTY_LIMITS[key].max).length}
									isError={errorMessage !== null}
									onCheckedChange={(next) => handlePenaltyCheckedChange(key, next)}
									onValueChange={(next) => handlePenaltyValueChange(key, next)}
									className="w-full"
								/>
								{isChecked && errorMessage && <FieldMessage message={errorMessage} />}
							</Fragment>
						);
					})}
				</section>
			</div>

			<section className={cn(SECTION_CARD_CLASS, "min-h-0 min-w-0 flex-1 flex-col gap-3")}>
				<SectionHeader
					tone="card"
					title="제품 등록"
					description={`칸은 ${LIMITS.productSlots}개입니다. 카드 쌍 수만큼 제품을 켜 주세요.`}
				/>
				{/* 안내 줄이 나타나고 사라질 때 목록이 움직이지 않게 줄 높이를 안내 줄(44)에 맞춰 둡니다 */}
				<div className="flex h-11 shrink-0 items-center gap-4">
					<p className="typo-admin-label whitespace-nowrap text-text-primary">
						사용 {countEnabledProducts(card.products)} / {pairCount}
					</p>
					{notice && <InlineNotice tone={notice.tone} message={notice.message} />}
				</div>
				<div
					className={cn(
						"flex min-h-0 flex-1 flex-col gap-2",
						"overflow-y-auto overscroll-contain [scrollbar-width:none]",
					)}>
					{card.products.map((product) => (
						<ProductRow
							key={product.slot}
							slot={product.slot}
							isEnabled={product.isEnabled}
							isShownInResult={product.isShownInResult}
							imageSrc={product.image ? getImageUrl(product.image.ko) : undefined}
							onEnabledChange={(isEnabled) => handleProductEnabledChange(product.slot, isEnabled)}
							onShownInResultChange={(isShown) =>
								handleProductShownInResultChange(product.slot, isShown)
							}
							className="shrink-0"
						/>
					))}
				</div>
			</section>
		</div>
	);
}
