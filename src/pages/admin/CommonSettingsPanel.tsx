import { ADMIN_TONE_LABEL } from "@/components/admin/adminToneLabel";
import OptionButton from "@/components/admin/OptionButton";
import SectionHeader from "@/components/admin/SectionHeader";
import Select from "@/components/admin/Select";
import Slider from "@/components/admin/Slider";
import { LIMITS } from "@/data/schema";
import { getIdleSecondsOptions } from "@/features/admin/commonSettings";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { useOrientation } from "@/layout/OrientationContext";
import { type CommonData, GAME_TYPES, type GameType } from "@/types/data";
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

const VOLUME_ROWS = [
	{ key: "bgmPercent", label: "배경음" },
	{ key: "sfxPercent", label: "효과음" },
] as const satisfies readonly { key: keyof CommonData["volume"]; label: string }[];

const AUTO_RESET_OPTIONS = [
	{ isEnabled: true, label: "ON", tone: "success" },
	{ isEnabled: false, label: "OFF", tone: "neutral" },
] as const;

export default function CommonSettingsPanel() {
	const layout = LAYOUT[useOrientation()];

	const common = useSettingsDraft((state) => state.draft.common);
	const setDraft = useSettingsDraft((state) => state.setDraft);
	const { activeGame, volume, playDurationSeconds, autoReset } = common;

	function handleActiveGameClick(game: GameType) {
		setDraft("common", { ...common, activeGame: game });
	}

	function handleVolumeChange(key: keyof CommonData["volume"], percent: number) {
		setDraft("common", { ...common, volume: { ...volume, [key]: percent } });
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

			<section className={cn(SECTION_CARD_CLASS, "flex-col gap-3")}>
				<SectionHeader
					title="소리"
					description={`배경음·효과음 크기 · ${LIMITS.volumePercent.step}% 단위`}
				/>
				{VOLUME_ROWS.map(({ key, label }) => (
					<div key={key} className="flex w-full items-center gap-3">
						<p className="typo-admin-label min-w-0 flex-1 text-text-primary">{label}</p>
						<Slider
							min={LIMITS.volumePercent.min}
							max={LIMITS.volumePercent.max}
							step={LIMITS.volumePercent.step}
							value={volume[key]}
							unit="%"
							tone="accent"
							label={label}
							onChange={(percent) => handleVolumeChange(key, percent)}
						/>
					</div>
				))}
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
		</div>
	);
}
