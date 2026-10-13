import { cva, type VariantProps } from "class-variance-authority";
import { useLayoutEffect, useRef, useState } from "react";
import AntigenBall from "@/components/vaccine/AntigenBall";
import { type AntigenLabel, getAntigenKey } from "@/components/vaccine/antigen";
import { useFontsLoadCount } from "@/components/vaccine/useFontsLoadCount";
import { cn } from "@/utils/cn";

const nameBarVariants = cva(
	[
		"flex w-full items-center justify-center px-6 py-5.5 text-center break-keep",
		"font-display typo-display-xs text-text-primary",
	],
	{
		variants: {
			tone: {
				"01": "bg-recipe-01",
				"02": "bg-recipe-02",
				"03": "bg-recipe-03",
				"04": "bg-recipe-04",
				"05": "bg-recipe-05",
			},
		},
		defaultVariants: {
			tone: "01",
		},
	},
);

const NAME_FONT_SIZES = [36, 32, 28, 24] as const;
const NAME_MAX_LINES = 2;

function fitNameFontSize(nameText: HTMLElement) {
	const fits = () => {
		const lineHeight = Number.parseFloat(getComputedStyle(nameText).lineHeight);
		return (
			Math.round(nameText.offsetHeight / lineHeight) <= NAME_MAX_LINES &&
			nameText.scrollWidth <= nameText.clientWidth
		);
	};

	for (const fontSize of NAME_FONT_SIZES) {
		nameText.style.fontSize = `${fontSize}px`;
		if (fits()) return fontSize;
	}
	return NAME_FONT_SIZES[NAME_FONT_SIZES.length - 1];
}

function splitIntoRows(antigens: AntigenLabel[]) {
	const firstRowCount = antigens.length <= 3 ? antigens.length : Math.ceil(antigens.length / 2);
	return [antigens.slice(0, firstRowCount), antigens.slice(firstRowCount)].filter(
		(row) => row.length > 0,
	);
}

type RecipeCardProps = VariantProps<typeof nameBarVariants> & {
	name: string;
	antigens: AntigenLabel[];
	className?: string;
};

export default function RecipeCard({ name, antigens, tone, className }: RecipeCardProps) {
	// 글꼴이 늦게 로드되면 글자 폭이 바뀌므로 다시 맞춘다.
	const fitKey = `${name}|${useFontsLoadCount()}`;
	const [fitted, setFitted] = useState<{ key: string; fontSize: number }>();
	const nameFontSize = fitted?.key === fitKey ? fitted.fontSize : NAME_FONT_SIZES[0];
	const nameTextRef = useRef<HTMLSpanElement>(null);

	useLayoutEffect(() => {
		if (!nameTextRef.current) return;
		setFitted({ key: fitKey, fontSize: fitNameFontSize(nameTextRef.current) });
	}, [fitKey]);

	return (
		<div
			className={cn(
				"flex w-144 flex-col overflow-hidden rounded-3xl border-2 border-border-default",
				"bg-background-surface",
				className,
			)}>
			<p className={nameBarVariants({ tone })}>
				<span ref={nameTextRef} className="min-w-0" style={{ fontSize: nameFontSize }}>
					{name}
				</span>
			</p>
			<div className="flex flex-col items-center justify-center gap-4 px-6 py-8">
				{splitIntoRows(antigens).map((row) => (
					<div
						key={row.map(getAntigenKey).join("|")}
						className="flex items-center justify-center gap-4">
						{row.map((antigen) => (
							<AntigenBall key={getAntigenKey(antigen)} {...antigen} />
						))}
					</div>
				))}
			</div>
		</div>
	);
}
