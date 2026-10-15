import { useState } from "react";
import { ADMIN_TONE_LABEL } from "@/components/admin/adminToneLabel";
import Button from "@/components/admin/Button";
import OptionButton from "@/components/admin/OptionButton";
import SectionHeader from "@/components/admin/SectionHeader";
import Select from "@/components/admin/Select";
import Slider from "@/components/admin/Slider";
import { LIMITS } from "@/data/schema";
import { getIdleSecondsOptions } from "@/features/admin/commonSettings";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { useOrientation } from "@/layout/OrientationContext";
import PinChangeOverlay from "@/pages/admin/PinChangeOverlay";
import { GAME_TYPES, type GameType } from "@/types/data";
import { cn } from "@/utils/cn";

const LAYOUT = {
	landscape: {
		panel: "w-192",
		gameOption: "w-87.5",
	},
	portrait: {
		panel: "w-full",
		gameOption: "flex-1",
	},
} as const;

const SECTION_CARD_CLASS =
	"flex rounded-2xl border-2 border-border-default bg-background-surface p-5";

const AUTO_RESET_OPTIONS = [
	{ isEnabled: true, label: "ON", tone: "success" },
	{ isEnabled: false, label: "OFF", tone: "neutral" },
] as const;

export default function CommonSettingsPanel() {
	const [isPinChangeOpen, setIsPinChangeOpen] = useState(false);
	const layout = LAYOUT[useOrientation()];

	const common = useSettingsDraft((state) => state.draft.common);
	const setDraft = useSettingsDraft((state) => state.setDraft);
	const { activeGame, playDurationSeconds, autoReset } = common;

	function handleActiveGameClick(game: GameType) {
		setDraft("common", { ...common, activeGame: game });
	}

	function handlePlayDurationChange(seconds: number) {
		setDraft("common", { ...common, playDurationSeconds: seconds });
	}

	function handleAutoResetClick(isEnabled: boolean) {
		setDraft("common", { ...common, autoReset: { ...autoReset, isEnabled } });
	}

	function handleIdleSecondsChange(idleSeconds: number) {
		setDraft("common", { ...common, autoReset: { ...autoReset, idleSeconds } });
	}

	function handlePinChangeClick() {
		setIsPinChangeOpen(true);
	}

	function handlePinChangeClose() {
		setIsPinChangeOpen(false);
	}

	return (
		<div className={cn("flex flex-col gap-6", layout.panel)}>
			<section className={cn(SECTION_CARD_CLASS, "flex-col gap-3")}>
				<SectionHeader title="운영 게임" />
				<div className="flex gap-3">
					{GAME_TYPES.map((game) => (
						<OptionButton
							key={game}
							label={ADMIN_TONE_LABEL[game]}
							isSelected={game === activeGame}
							isRadioVisible
							onClick={() => handleActiveGameClick(game)}
							className={cn("h-20", layout.gameOption)}
						/>
					))}
				</div>
			</section>

			<section className={cn(SECTION_CARD_CLASS, "items-center gap-3")}>
				<SectionHeader
					title="제한 시간"
					description={`두 게임 공통 · ${LIMITS.playDurationSeconds.step}초 단위`}
					className="min-w-0 flex-1"
				/>
				<Slider
					min={LIMITS.playDurationSeconds.min}
					max={LIMITS.playDurationSeconds.max}
					step={LIMITS.playDurationSeconds.step}
					value={playDurationSeconds}
					unit="초"
					tone="accent"
					label="제한 시간"
					onChange={handlePlayDurationChange}
				/>
			</section>

			<section className={cn(SECTION_CARD_CLASS, "items-center justify-between gap-3")}>
				<SectionHeader title="관리자 PIN" />
				<Button
					label="PIN 변경"
					variant="secondary"
					className="h-16 w-50"
					onClick={handlePinChangeClick}
				/>
			</section>

			<section className={cn(SECTION_CARD_CLASS, "flex-col gap-3")}>
				<SectionHeader
					title="자동 초기화"
					description="일정 시간 조작이 없으면 시작 화면으로 돌아갑니다."
				/>
				<div className="flex items-center gap-3">
					{AUTO_RESET_OPTIONS.map((option) => (
						<OptionButton
							key={option.label}
							label={option.label}
							tone={option.tone}
							isSelected={option.isEnabled === autoReset.isEnabled}
							onClick={() => handleAutoResetClick(option.isEnabled)}
							className="w-30"
						/>
					))}
					{autoReset.isEnabled && (
						<Select
							options={getIdleSecondsOptions(autoReset.idleSeconds)}
							value={autoReset.idleSeconds}
							label="자동 초기화 시간"
							onChange={handleIdleSecondsChange}
						/>
					)}
				</div>
			</section>

			{isPinChangeOpen && (
				<PinChangeOverlay onCancel={handlePinChangeClose} onChanged={handlePinChangeClose} />
			)}
		</div>
	);
}
