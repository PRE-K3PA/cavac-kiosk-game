import { Fragment } from "react";
import FieldMessage from "@/components/admin/FieldMessage";
import PenaltyRow from "@/components/admin/PenaltyRow";
import SectionHeader from "@/components/admin/SectionHeader";
import {
	getPenaltyErrorMessage,
	getPenaltyInputValue,
	PENALTY_LIMITS,
	PENALTY_ROWS,
	type PenaltyKey,
	setPenaltyEnabled,
	setPenaltyValue,
} from "@/features/admin/penaltySettings";
import type { GameType, Penalty } from "@/types/data";
import { cn } from "@/utils/cn";

const SECTION_CARD_CLASS =
	"flex rounded-2xl border-2 border-border-default bg-background-surface p-5";

type PenaltySectionProps = {
	tone: GameType;
	penalty: Penalty;
	originalPenalty: Penalty;
	onChange: (penalty: Penalty) => void;
};

export default function PenaltySection({
	tone,
	penalty,
	originalPenalty,
	onChange,
}: PenaltySectionProps) {
	function handleCheckedChange(key: PenaltyKey, isEnabled: boolean) {
		onChange(setPenaltyEnabled(penalty, originalPenalty, key, isEnabled));
	}

	function handleValueChange(key: PenaltyKey, value: number | null) {
		onChange(setPenaltyValue(penalty, key, value));
	}

	return (
		<section className={cn(SECTION_CARD_CLASS, "flex-col gap-3")}>
			<SectionHeader
				tone={tone}
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
							onCheckedChange={(next) => handleCheckedChange(key, next)}
							onValueChange={(next) => handleValueChange(key, next)}
							className="w-full"
						/>
						{isChecked && errorMessage && <FieldMessage message={errorMessage} />}
					</Fragment>
				);
			})}
		</section>
	);
}
