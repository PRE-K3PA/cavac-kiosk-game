import FieldMessage from "@/components/admin/FieldMessage";
import OptionButton from "@/components/admin/OptionButton";
import SectionHeader from "@/components/admin/SectionHeader";
import Select from "@/components/admin/Select";
import Slider from "@/components/admin/Slider";
import { LIMITS } from "@/data/schema";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import {
	FALL_SPEED_STEP,
	getHintDelayOptions,
	getHintWarning,
} from "@/features/admin/vaccineSettings";
import { useOrientation } from "@/layout/OrientationContext";
import PenaltySection from "@/pages/admin/PenaltySection";
import type { Penalty, VaccineGameSettings } from "@/types/data";
import { cn } from "@/utils/cn";

const LAYOUT = {
	landscape: {
		panel: "flex-row",
		sideColumn: "w-140 shrink-0 gap-3",
	},
	portrait: {
		panel: "flex-col",
		sideColumn: "gap-6",
	},
} as const;

const SECTION_CARD_CLASS =
	"flex rounded-2xl border-2 border-border-default bg-background-surface p-5";

const HINT_OPTIONS = [
	{ isEnabled: true, label: "ON", tone: "success" },
	{ isEnabled: false, label: "OFF", tone: "neutral" },
] as const;

export default function VaccineSettingsPanel() {
	const layout = LAYOUT[useOrientation()];

	const vaccine = useSettingsDraft((state) => state.draft["vaccine-game"]);
	const originalSettings = useSettingsDraft((state) => state.original["vaccine-game"].settings);
	const savedPlayDurationSeconds = useSettingsDraft(
		(state) => state.original.common.playDurationSeconds,
	);
	const setDraft = useSettingsDraft((state) => state.setDraft);
	const { settings } = vaccine;
	const hintWarning = getHintWarning(vaccine, savedPlayDurationSeconds);

	function updateSettings(next: VaccineGameSettings) {
		setDraft("vaccine-game", { ...vaccine, settings: next });
	}

	function handleFallSpeedChange(fallSpeedPercent: number) {
		updateSettings({ ...settings, fallSpeedPercent });
	}

	function handleMaxAntigensChange(maxAntigensOnScreen: number) {
		updateSettings({ ...settings, maxAntigensOnScreen });
	}

	function handleHintClick(isEnabled: boolean) {
		updateSettings({ ...settings, hint: { ...settings.hint, isEnabled } });
	}

	function handleHintDelayChange(delaySeconds: number) {
		updateSettings({ ...settings, hint: { ...settings.hint, delaySeconds } });
	}

	function handlePenaltyChange(penalty: Penalty) {
		updateSettings({ ...settings, penalty });
	}

	return (
		<div className={cn("flex h-full gap-6", layout.panel)}>
			<div className={cn("flex flex-col", layout.sideColumn)}>
				<section className={cn(SECTION_CARD_CLASS, "flex-col gap-3")}>
					<SectionHeader tone="vaccine" title="항원 낙하 속도" />
					<Slider
						min={LIMITS.fallSpeedPercent.min}
						max={LIMITS.fallSpeedPercent.max}
						step={FALL_SPEED_STEP}
						value={settings.fallSpeedPercent}
						unit="%"
						label="항원 낙하 속도"
						onChange={handleFallSpeedChange}
					/>
				</section>

				<section className={cn(SECTION_CARD_CLASS, "flex-col gap-3")}>
					<SectionHeader tone="vaccine" title="동시 등장 항원 수" />
					<Slider
						min={LIMITS.maxAntigensOnScreen.min}
						max={LIMITS.maxAntigensOnScreen.max}
						value={settings.maxAntigensOnScreen}
						unit="개"
						label="동시 등장 항원 수"
						onChange={handleMaxAntigensChange}
					/>
				</section>

				<section className={cn(SECTION_CARD_CLASS, "flex-col gap-3")}>
					<SectionHeader
						tone="vaccine"
						title="정답 항원 힌트"
						description="일정 시간 안에 정답을 못 고르면 필요한 항원을 강조합니다."
					/>
					<div className="flex items-center gap-3">
						{HINT_OPTIONS.map((option) => (
							<OptionButton
								key={option.label}
								label={option.label}
								tone={option.tone}
								isSelected={option.isEnabled === settings.hint.isEnabled}
								onClick={() => handleHintClick(option.isEnabled)}
								className="w-30"
							/>
						))}
						{settings.hint.isEnabled && (
							<Select
								options={getHintDelayOptions(originalSettings.hint.delaySeconds)}
								value={settings.hint.delaySeconds}
								label="힌트 시간"
								onChange={handleHintDelayChange}
							/>
						)}
					</div>
					{hintWarning && <FieldMessage tone="warning" message={hintWarning} />}
				</section>

				<PenaltySection
					tone="vaccine"
					penalty={settings.penalty}
					originalPenalty={originalSettings.penalty}
					onChange={handlePenaltyChange}
				/>
			</div>
		</div>
	);
}
