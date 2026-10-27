import { useState } from "react";
import ImagePreviewModal from "@/components/admin/ImagePreviewModal";
import ModalOverlay from "@/components/admin/ModalOverlay";
import { formatOrientationBasis } from "@/components/admin/orientationLabel";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { OrientationProvider, useOrientation } from "@/layout/OrientationContext";
import type { Orientation } from "@/layout/stage";
import { CARD_HOME } from "@/pages/card/cardHomeContent";
import HomeTemplate, { type HomeContent } from "@/pages/home/HomeTemplate";
import { toHomeAnimals } from "@/pages/home/useHomeAnimals";
import { VACCINE_HOME } from "@/pages/vaccine/vaccineHomeContent";
import type { GameType } from "@/types/data";
import { cn } from "@/utils/cn";

// 실제 홈 화면(VaccineHome·CardHome)과 같은 값입니다. 카드 홈은 세로 화면에서 본문을 위부터 쌓습니다
const HOME_SCREEN_PROPS = {
	vaccine: { content: VACCINE_HOME },
	card: { content: CARD_HOME, portraitAlign: "start" },
} satisfies Record<GameType, { content: HomeContent; portraitAlign?: "start" | "center" }>;

/** 홈 화면을 가로는 616px 폭, 세로는 560px 높이로 줄여 보여 줍니다 */
const HOME_PREVIEW_SIZE = {
	landscape: { frame: "h-[346.5px] w-154", screen: "h-270 w-480 scale-[0.3208333]" },
	portrait: { frame: "h-140 w-78.75", screen: "h-480 w-270 scale-[0.2916667]" },
} as const satisfies Record<Orientation, { frame: string; screen: string }>;

type HomePreviewOverlayProps = {
	onClose: () => void;
};

function ignore() {}

// Figma ImagePreviewOverlay_Character1~4: 지금 키오스크 화면 방향부터 보여 주고, 전환 버튼으로 가로·세로를 바꿉니다
export default function HomePreviewOverlay({ onClose }: HomePreviewOverlayProps) {
	const stageOrientation = useOrientation();
	const [previewOrientation, setPreviewOrientation] = useState(stageOrientation);
	const common = useSettingsDraft((state) => state.draft.common);

	const animals = toHomeAnimals(common);
	const animalCount = Object.keys(animals).length;
	const size = HOME_PREVIEW_SIZE[previewOrientation];

	return (
		<ModalOverlay>
			<ImagePreviewModal
				tone="common"
				description={`축종 캐릭터 — 메인 화면에 동물이 ${animalCount}마리일 때 이렇게 보입니다.`}
				captionStyle="chip"
				items={[
					{
						caption: `메인 화면 · 동물 ${animalCount}마리 (${formatOrientationBasis(previewOrientation)})`,
						content: (
							<div inert className={cn("overflow-hidden rounded-xl", size.frame)}>
								<div className={cn("origin-top-left", size.screen)}>
									<OrientationProvider orientation={previewOrientation}>
										<HomeTemplate
											{...HOME_SCREEN_PROPS[common.activeGame]}
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
				orientation={previewOrientation}
				onOrientationChange={setPreviewOrientation}
				onCloseClick={onClose}
			/>
		</ModalOverlay>
	);
}
