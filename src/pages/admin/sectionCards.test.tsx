import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ORIENTATION_LABEL } from "@/components/admin/orientationLabel";
import { createMockData } from "@/data/mock/mock-platform";
import * as storage from "@/data/storage";
import { OrientationProvider } from "@/layout/OrientationContext";
import type { Orientation } from "@/layout/stage";
import type { DataFile } from "@/types/data";

const stored = createMockData("filled");

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getData: mock(async (file: DataFile) => structuredClone(stored[file])),
	getImageUrl: (path: string) => `file://${path}`,
}));

const { useSettingsDraft } = await import("@/features/admin/settingsDraft");
const { default: CardSettingsPanel } = await import("@/pages/admin/CardSettingsPanel");
const { default: CommonSettingsPanel } = await import("@/pages/admin/CommonSettingsPanel");
const { default: HomeAnimalPanel } = await import("@/pages/admin/HomeAnimalPanel");
const { default: VaccineSettingsPanel } = await import("@/pages/admin/VaccineSettingsPanel");

const ORIENTATIONS = ["landscape", "portrait"] as const satisfies readonly Orientation[];

// 관리자 설정 화면의 섹션은 모두 같은 카드 모양(흰 바탕, 테두리, 둥근 모서리, 안쪽 여백)입니다
const SECTION_CARD_CLASSES = [
	"flex",
	"rounded-2xl",
	"border-2",
	"border-border-default",
	"bg-background-surface",
	"p-5",
];

// 축종 설정은 섹션 하나가 패널 전체라서 카드 모양에 세로 쌓기와 화면 방향별 패널 크기가 붙습니다
const HOME_ANIMAL_SECTION_CLASSES: Record<Orientation, string[]> = {
	landscape: [...SECTION_CARD_CLASSES, "min-h-0", "flex-col", "gap-3", "max-h-full", "w-192"],
	portrait: [...SECTION_CARD_CLASSES, "min-h-0", "flex-col", "gap-3", "w-full"],
};

// 백신 설정은 PenaltySection·VaccineListSection 을, 카드 설정은 PenaltySection 을 안에 그립니다
const PANELS: { name: string; panel: ReactNode; sectionTitles: string[] }[] = [
	{
		name: "공통 설정",
		panel: <CommonSettingsPanel />,
		sectionTitles: ["운영 게임", "소리", "제한 시간", "자동 초기화"],
	},
	{ name: "축종 설정", panel: <HomeAnimalPanel />, sectionTitles: ["축종 설정"] },
	{
		name: "백신 설정",
		panel: <VaccineSettingsPanel />,
		sectionTitles: [
			"항원 낙하 속도",
			"동시 등장 항원 수",
			"정답 항원 힌트",
			"오답 패널티",
			"백신 관리",
		],
	},
	{
		name: "카드 설정",
		panel: <CardSettingsPanel />,
		sectionTitles: ["카드 쌍 수", "오답 패널티", "제품 등록"],
	},
];

beforeEach(async () => {
	await useSettingsDraft.getState().load();
});

afterEach(cleanup);

function renderPanel(panel: ReactNode, orientation: Orientation) {
	render(<OrientationProvider orientation={orientation}>{panel}</OrientationProvider>);
}

function getSectionClasses(title: string) {
	const section = screen.getByRole("heading", { name: title }).closest("section");
	return section ? [...section.classList] : [];
}

function hasSectionCardLook(title: string) {
	const classes = getSectionClasses(title);
	return SECTION_CARD_CLASSES.every((className) => classes.includes(className));
}

for (const { name, panel, sectionTitles } of PANELS) {
	describe(`${name} 화면`, () => {
		for (const orientation of ORIENTATIONS) {
			test(`${ORIENTATION_LABEL[orientation]} 화면에서 섹션이 모두 섹션 카드 모양이다`, () => {
				renderPanel(panel, orientation);
				// 카드 모양이 아닌 섹션은 제목이 빠져서 실패 메시지에 드러납니다
				expect(sectionTitles.filter(hasSectionCardLook)).toEqual(sectionTitles);
			});
		}
	});
}

describe("축종 설정 섹션", () => {
	for (const orientation of ORIENTATIONS) {
		test(`${ORIENTATION_LABEL[orientation]} 화면에서 카드 모양과 패널 배치 클래스만 갖는다`, () => {
			renderPanel(<HomeAnimalPanel />, orientation);
			const expected = HOME_ANIMAL_SECTION_CLASSES[orientation];
			const classes = getSectionClasses("축종 설정");
			expect(classes).toHaveLength(expected.length);
			expect(classes).toEqual(expect.arrayContaining(expected));
		});
	}
});
