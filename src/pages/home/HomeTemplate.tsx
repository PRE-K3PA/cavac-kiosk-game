import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import imgHomeBackground from "@/assets/images/common/imgHomeBackground.png";
import imgLogoEn from "@/assets/images/common/imgLogoEn.png";
import imgLogoKo from "@/assets/images/common/imgLogoKo.png";
import AnimalSlot from "@/components/common/AnimalSlot";
import HowToPlayCard from "@/components/common/HowToPlayCard";
import LanguageButton from "@/components/common/LanguageButton";
import SoundButton from "@/components/common/SoundButton";
import StartButton from "@/components/common/StartButton";
import { useOrientation } from "@/layout/OrientationContext";
import ScreenLayout from "@/layout/ScreenLayout";
import { type HomeAnimals, useHomeAnimals } from "@/pages/home/useHomeAnimals";
import { useSessionStore } from "@/store/sessionStore";
import { HOME_SLOTS, type Localized } from "@/types/data";
import { cn } from "@/utils/cn";

export type HomeScreenProps = {
	onStart: () => void;
	onAdminActivate: () => void;
};

type HomeStepMedia = { src: string; fit: "contain" | "cover" };

/** 문구는 네임스페이스 사전에 있고, 여기에는 사전을 고르는 이름과 번역 대상이 아닌 그림만 둡니다 */
export type HomeContent = {
	namespace: "vaccineHome" | "cardHome";
	stepMedia: readonly [HomeStepMedia, HomeStepMedia, HomeStepMedia];
};

type HomeTemplateProps = HomeScreenProps & {
	content: HomeContent;
	/** 세로 화면에서 본문을 위쪽부터 쌓을지 세로 중앙에 둘지. 가로 화면은 항상 중앙 */
	portraitAlign?: "start" | "center";
	/** 넘기면 저장된 동물 대신 이 동물을 놓습니다. 관리자 화면의 캐릭터 미리보기가 씁니다 */
	animals?: HomeAnimals;
};

const HOME_LOGO = {
	ko: imgLogoKo,
	en: imgLogoEn,
} satisfies Localized<string>;

const STEP_ACCENTS = ["yellow", "green", "blue"] as const;
const STEP_KEYS = ["step1", "step2", "step3"] as const;

// -webkit-text-stroke 는 글자 경계 중앙에 그려지므로 Figma 외곽선 폭의 2배를 주고 fill 을 위에 칠한다
const TITLE_OUTLINE = cn(
	"[paint-order:stroke_fill] [stroke-linejoin:round]",
	"[-webkit-text-stroke-color:var(--color-text-inverse)] [-webkit-text-stroke-width:24px]",
);

const LAYOUT = {
	landscape: {
		header: "h-28.5 px-12",
		logo: "h-19.75 w-59.25",
		actions: "mt-5 gap-3.75 self-start",
		main: "gap-8 py-8",
		hero: "gap-4 py-5",
		howToPlay: "gap-6",
		steps: "flex-row justify-center gap-15",
		cardDirection: "column",
		animalSize: "bottom-0.5 size-62.5",
		animalX: {
			"left-2": "left-7.5",
			"left-1": "left-46.75",
			"right-1": "right-47.25",
			"right-2": "right-8",
		},
	},
	portrait: {
		header: "h-40 px-12 py-6",
		logo: "h-22 w-70",
		actions: "gap-4",
		main: "gap-30 px-16 pt-20 pb-30",
		hero: "gap-6",
		howToPlay: "gap-8",
		steps: "flex-col gap-8",
		cardDirection: "row",
		animalSize: "bottom-5 size-45",
		animalX: {
			"left-2": "left-7.5",
			"left-1": "left-39.75",
			"right-1": "right-39.75",
			"right-2": "right-7.5",
		},
	},
} as const;

export default function HomeTemplate({
	portraitAlign = "center",
	content,
	onStart,
	onAdminActivate,
	animals: previewAnimals,
}: HomeTemplateProps) {
	const { t } = useTranslation();
	const { t: tContent } = useTranslation(content.namespace);
	const language = useSessionStore((s) => s.language);
	const toggleLanguage = useSessionStore((s) => s.toggleLanguage);
	const isMuted = useSessionStore((s) => s.isMuted);
	const toggleMute = useSessionStore((s) => s.toggleMute);
	const resetSession = useSessionStore((s) => s.reset);
	const savedAnimals = useHomeAnimals();
	const animals = previewAnimals ?? savedAnimals;
	const orientation = useOrientation();

	// 홈은 다음 관람객이 처음 만나는 화면입니다. 앞 사람의 언어와 음소거를 여기서 지웁니다
	useEffect(() => {
		resetSession();
	}, [resetSession]);

	const layout = LAYOUT[orientation];
	const isCentered = orientation === "landscape" || portraitAlign === "center";

	return (
		<ScreenLayout
			onAdminActivate={onAdminActivate}
			background={
				<>
					<img
						src={imgHomeBackground}
						alt=""
						draggable={false}
						className="size-full object-cover"
					/>
					<div className="absolute inset-0 bg-background-surface/35" />
				</>
			}>
			<header className={cn("relative flex shrink-0 items-center justify-between", layout.header)}>
				<img
					src={HOME_LOGO[language]}
					alt={t("logoAlt")}
					draggable={false}
					className={cn("object-contain", layout.logo)}
				/>
				<div className={cn("flex", layout.actions)}>
					<SoundButton label={t("soundLabel")} muted={isMuted} onClick={toggleMute} />
					<LanguageButton label={t("languageLabel")} language={language} onClick={toggleLanguage} />
				</div>
			</header>

			<main
				className={cn(
					"relative flex min-h-0 flex-1 flex-col items-center",
					isCentered && "justify-center",
					layout.main,
				)}>
				<div className={cn("flex w-full flex-col items-center text-center", layout.hero)}>
					<h1 className={cn("typo-display-xl whitespace-nowrap font-display", TITLE_OUTLINE)}>
						<span className="text-brand-primary">{tContent("title.accent")}</span>{" "}
						<span className="text-text-primary">{tContent("title.rest")}</span>
					</h1>
					<p className="typo-label-l w-full text-text-secondary">{tContent("subtitle")}</p>
				</div>

				<section className={cn("flex w-full flex-col items-center", layout.howToPlay)}>
					<h2 className="typo-title-m whitespace-nowrap text-text-primary">{t("howToPlay")}</h2>
					<div className={cn("flex w-full items-center", layout.steps)}>
						{content.stepMedia.map((media, index) => (
							<HowToPlayCard
								key={STEP_KEYS[index]}
								step={String(index + 1)}
								description={tContent(STEP_KEYS[index])}
								accent={STEP_ACCENTS[index]}
								direction={layout.cardDirection}
								tip={index === content.stepMedia.length - 1 ? t("tip") : undefined}
								media={
									<img
										src={media.src}
										alt=""
										draggable={false}
										className={cn(
											"size-full",
											media.fit === "cover" ? "object-cover" : "object-contain",
										)}
									/>
								}
							/>
						))}
					</div>
				</section>

				<StartButton label={t("start")} onClick={onStart} />
			</main>

			{HOME_SLOTS.map((slot) => {
				const animal = animals[slot];
				if (!animal) return null;
				return (
					<AnimalSlot
						key={slot}
						side={slot.startsWith("left") ? "left" : "right"}
						src={animal.src}
						name={animal.name}
						className={cn("absolute", layout.animalSize, layout.animalX[slot])}
					/>
				);
			})}
		</ScreenLayout>
	);
}
