import ImagePreviewModal from "@/components/admin/ImagePreviewModal";
import ModalOverlay from "@/components/admin/ModalOverlay";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { toSpeciesOptions } from "@/features/admin/speciesForm";
import { OrientationProvider } from "@/layout/OrientationContext";
import { CARD_HOME } from "@/pages/card/cardHomeContent";
import HomeTemplate, { type HomeContent } from "@/pages/home/HomeTemplate";
import type { HomeAnimals } from "@/pages/home/useHomeAnimals";
import { VACCINE_HOME } from "@/pages/vaccine/vaccineHomeContent";
import type { GameType } from "@/types/data";

const HOME_CONTENT = {
	vaccine: VACCINE_HOME,
	card: CARD_HOME,
} satisfies Record<GameType, HomeContent>;

type HomePreviewOverlayProps = {
	onClose: () => void;
};

function ignore() {}

// Figma ImagePreviewOverlay_Character1~4: 화면 방향과 상관없이 가로 홈 화면을 616px 폭으로 줄여 보여 줍니다
export default function HomePreviewOverlay({ onClose }: HomePreviewOverlayProps) {
	const common = useSettingsDraft((state) => state.draft.common);

	const speciesOptions = toSpeciesOptions(common.species);
	const animals: HomeAnimals = {};
	for (const { slot, speciesId } of common.homeAnimals) {
		const found = speciesOptions.find((species) => species.id === speciesId);
		if (found) animals[slot] = { src: found.imageSrc, name: found.name };
	}
	const animalCount = Object.keys(animals).length;

	return (
		<ModalOverlay>
			<ImagePreviewModal
				tone="common"
				description={`축종 캐릭터 — 메인 화면에 동물이 ${animalCount}마리일 때 이렇게 보입니다.`}
				captionStyle="chip"
				items={[
					{
						caption: `메인 화면 · 동물 ${animalCount}마리 (가로 화면 기준)`,
						content: (
							<div inert className="h-[346.5px] w-154 overflow-hidden rounded-xl">
								<div className="h-270 w-480 origin-top-left scale-[0.3208333]">
									<OrientationProvider orientation="landscape">
										<HomeTemplate
											content={HOME_CONTENT[common.activeGame]}
											animals={animals}
											onStart={ignore}
											onAdminActivate={ignore}
										/>
									</OrientationProvider>
								</div>
							</div>
						),
					},
				]}
				onCloseClick={onClose}
			/>
		</ModalOverlay>
	);
}
