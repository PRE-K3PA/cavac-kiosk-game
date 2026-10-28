import { cva, type VariantProps } from "class-variance-authority";
import AntigenBall from "@/components/vaccine/AntigenBall";
import type { AntigenLabel } from "@/components/vaccine/antigen";
import MarqueeName from "@/components/vaccine/MarqueeName";
import { antigenKey } from "@/data/rules";
import { cn } from "@/utils/cn";

const nameBarVariants = cva(
	[
		"flex w-full items-center justify-center px-6 py-5.5 text-center break-keep",
		"font-display typo-display-m text-text-primary",
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

function splitIntoRows(antigens: AntigenLabel[]) {
	const firstRowCount = antigens.length <= 3 ? antigens.length : Math.ceil(antigens.length / 2);
	return [antigens.slice(0, firstRowCount), antigens.slice(firstRowCount)].filter(
		(row) => row.length > 0,
	);
}

type RecipeCardProps = VariantProps<typeof nameBarVariants> & {
	name: string;
	antigens: AntigenLabel[];
	/** 켜면 구슬이 한 줄이어도 구슬 영역을 두 줄 높이로 둔다. 한 화면의 카드 높이를 맞출 때 쓴다 */
	isTwoRowHeight?: boolean;
	className?: string;
};

export default function RecipeCard({
	name,
	antigens,
	tone,
	isTwoRowHeight,
	className,
}: RecipeCardProps) {
	return (
		<div
			className={cn(
				"flex w-144 flex-col overflow-hidden rounded-3xl border-2 border-border-default",
				"bg-background-surface",
				className,
			)}>
			{/* 이름은 한 줄이고 넘치면 흐르므로, 이름 길이가 달라도 카드 높이가 같다 */}
			<div className={nameBarVariants({ tone })}>
				<MarqueeName name={name} className="min-w-0" />
			</div>
			<div
				className={cn(
					"flex flex-col items-center justify-center gap-4 px-6 py-8",
					isTwoRowHeight && "h-102",
				)}>
				{splitIntoRows(antigens).map((row) => (
					<div
						key={row.map(antigenKey).join("|")}
						className="flex items-center justify-center gap-4">
						{row.map((antigen) => (
							<AntigenBall key={antigenKey(antigen)} {...antigen} />
						))}
					</div>
				))}
			</div>
		</div>
	);
}
