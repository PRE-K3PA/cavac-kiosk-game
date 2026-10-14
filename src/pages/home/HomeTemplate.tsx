import { useState } from "react";
import imgHomeBackground from "@/assets/images/common/imgHomeBackground.png";
import imgLogoEn from "@/assets/images/common/imgLogoEn.png";
import imgLogoKo from "@/assets/images/common/imgLogoKo.png";
import AdminHotspot from "@/components/common/AdminHotspot";
import AnimalSlot from "@/components/common/AnimalSlot";
import HowToPlayCard from "@/components/common/HowToPlayCard";
import LanguageButton from "@/components/common/LanguageButton";
import SoundButton from "@/components/common/SoundButton";
import StartButton from "@/components/common/StartButton";
import type { Language } from "@/hooks/useLanguage";
import { useHomeAnimals } from "@/pages/home/useHomeAnimals";
import { HOME_SLOTS, type Localized } from "@/types/data";
import { cn } from "@/utils/cn";

export type HomeOrientation = "landscape" | "portrait";

export type HomeTemplateProps = {
	orientation?: HomeOrientation;
	onStart: () => void;
	onAdminActivate: () => void;
};

type HomeStep = {
	description: Localized<string>;
	media: { src: string; fit: "contain" | "cover" };
};

export type HomeContent = {
	title: Localized<{ accent: string; rest: string }>;
	subtitle: Localized<string>;
	steps: readonly [HomeStep, HomeStep, HomeStep];
};

type HomeTemplateInnerProps = HomeTemplateProps & {
	content: HomeContent;
	language: Language;
	onToggleLanguage: () => void;
	/** 세로 화면에서 본문을 위쪽부터 쌓을지 세로 중앙에 둘지. 가로 화면은 항상 중앙 */
	portraitAlign?: "start" | "center";
};

const HOME_COMMON_COPY = {
	howToPlay: { ko: "게임 방법", en: "How to Play" },
	tip: { ko: "틀리면 패널티! 신중하게 선택하세요.", en: "Wrong picks cost points!" },
	start: { ko: "시작하기", en: "Start" },
	soundLabel: { ko: "소리", en: "Sound" },
	languageLabel: { ko: "언어 변경", en: "Change language" },
} satisfies Record<string, Localized<string>>;

const HOME_LOGO = {
	ko: { src: imgLogoKo, alt: "중앙백신연구소" },
	en: { src: imgLogoEn, alt: "CAVAC ChoongAng Vaccine Lab." },
} satisfies Localized<{ src: string; alt: string }>;

const STEP_ACCENTS = ["yellow", "green", "blue"] as const;

// -webkit-text-stroke 는 글자 경계 중앙에 그려지므로 Figma 외곽선 폭의 2배를 주고 fill 을 위에 칠한다
const TITLE_OUTLINE = cn(
	"[paint-order:stroke_fill] [stroke-linejoin:round]",
	"[-webkit-text-stroke-color:var(--color-text-inverse)] [-webkit-text-stroke-width:1.5rem]",
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
		hotspot: "",
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
		hotspot: "size-50",
	},
} as const;

export default function HomeTemplate({
	orientation = "landscape",
	portraitAlign = "center",
	content,
	language,
	onToggleLanguage,
	onStart,
	onAdminActivate,
}: HomeTemplateInnerProps) {
	const [isMuted, setIsMuted] = useState(false);
	const animals = useHomeAnimals();

	const layout = LAYOUT[orientation];
	const isCentered = orientation === "landscape" || portraitAlign === "center";
	const logo = HOME_LOGO[language];
	const title = content.title[language];

	return (
		<div className="relative flex size-full flex-col overflow-hidden">
			<img
				src={imgHomeBackground}
				alt=""
				draggable={false}
				className="pointer-events-none absolute inset-0 size-full object-cover"
			/>
			<div aria-hidden="true" className="absolute inset-0 bg-background-surface/35" />

			<header className={cn("relative flex shrink-0 items-center justify-between", layout.header)}>
				<img
					src={logo.src}
					alt={logo.alt}
					draggable={false}
					className={cn("object-contain", layout.logo)}
				/>
				<div className={cn("flex", layout.actions)}>
					<SoundButton
						label={HOME_COMMON_COPY.soundLabel[language]}
						muted={isMuted}
						onClick={() => setIsMuted((muted) => !muted)}
					/>
					<LanguageButton
						label={HOME_COMMON_COPY.languageLabel[language]}
						language={language}
						onClick={onToggleLanguage}
					/>
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
						<span className="text-brand-primary">{title.accent}</span>{" "}
						<span className="text-text-primary">{title.rest}</span>
					</h1>
					<p className="typo-label-l w-full text-text-secondary">{content.subtitle[language]}</p>
				</div>

				<section className={cn("flex w-full flex-col items-center", layout.howToPlay)}>
					<h2 className="typo-title-m whitespace-nowrap text-text-primary">
						{HOME_COMMON_COPY.howToPlay[language]}
					</h2>
					<div className={cn("flex w-full items-center", layout.steps)}>
						{content.steps.map((step, index) => (
							<HowToPlayCard
								key={step.description.ko}
								step={String(index + 1)}
								description={step.description[language]}
								accent={STEP_ACCENTS[index]}
								direction={layout.cardDirection}
								tip={
									index === content.steps.length - 1 ? HOME_COMMON_COPY.tip[language] : undefined
								}
								media={
									<img
										src={step.media.src}
										alt=""
										draggable={false}
										className={cn(
											"size-full",
											step.media.fit === "cover" ? "object-cover" : "object-contain",
										)}
									/>
								}
							/>
						))}
					</div>
				</section>

				<StartButton label={HOME_COMMON_COPY.start[language]} onClick={onStart} />
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

			<AdminHotspot
				onActivate={onAdminActivate}
				className={cn("absolute top-0 left-0", layout.hotspot)}
			/>
		</div>
	);
}
