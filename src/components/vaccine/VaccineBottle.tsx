import { useId } from "react";
import { toPercent } from "@/components/vaccine/percent";
import { cn } from "@/utils/cn";

const BODY_PATH =
	"M2.5 98 A30 30 0 0 1 32.5 68 H127.5 A30 30 0 0 1 157.5 98 V249.5 A20 20 0 0 1 137.5 269.5" +
	" H22.5 A20 20 0 0 1 2.5 249.5 Z";

const LIQUID_BOTTOM_Y = 262;
const LIQUID_FULL_Y = 86;
const LIQUID_SURFACE_RY = 7;

function getLiquidTopY(fillPercent: number) {
	return LIQUID_BOTTOM_Y - ((LIQUID_BOTTOM_Y - LIQUID_FULL_Y) * fillPercent) / 100;
}

type VaccineBottleProps = {
	fill: number;
	label?: string;
	className?: string;
};

export default function VaccineBottle({ fill, label, className }: VaccineBottleProps) {
	const clipId = useId();
	const fillPercent = toPercent(fill);
	const liquidTopY = getLiquidTopY(fillPercent);
	const hasLiquid = fillPercent > 0;
	const percentText = `${Math.round(fillPercent)}%`;

	return (
		<svg
			role="img"
			aria-label={label ? `${label} ${percentText}` : percentText}
			viewBox="0 0 160 272"
			className={cn("h-68 w-40 shrink-0", className)}>
			<defs>
				<clipPath id={clipId}>
					<path d={BODY_PATH} />
				</clipPath>
			</defs>
			<path d={BODY_PATH} className="fill-bottle-glass" />
			<ellipse
				cx="80"
				cy="81"
				rx="58"
				ry="11"
				className="fill-none stroke-bottle-outline opacity-10"
				strokeWidth="2"
			/>
			<ellipse
				cx="80"
				cy="250"
				rx="66"
				ry="12"
				className="fill-none stroke-bottle-outline opacity-10"
				strokeWidth="2"
			/>
			{hasLiquid && (
				<g clipPath={`url(#${clipId})`}>
					<rect
						x="0"
						y={liquidTopY}
						width="160"
						height={272 - liquidTopY}
						className="fill-bottle-liquid"
					/>
					<ellipse
						cx="80"
						cy={liquidTopY}
						rx="78"
						ry={LIQUID_SURFACE_RY}
						className="fill-bottle-liquid-top stroke-bottle-liquid-edge"
						strokeWidth="2"
					/>
				</g>
			)}
			<rect
				x="14"
				y="112"
				width="8"
				height="78"
				rx="4"
				className="fill-background-surface opacity-80"
			/>
			<rect
				x="14"
				y="204"
				width="8"
				height="18"
				rx="4"
				className="fill-background-surface opacity-80"
			/>
			<path d={BODY_PATH} className="fill-none stroke-bottle-outline" strokeWidth="5" />
			<rect
				x="33"
				y="44"
				width="94"
				height="26"
				rx="4"
				className="fill-bottle-neck stroke-bottle-outline"
				strokeWidth="5"
			/>
			<rect
				x="25"
				y="12"
				width="110"
				height="36"
				rx="10"
				className="fill-bottle-cap stroke-bottle-outline"
				strokeWidth="5"
			/>
			<ellipse
				cx="80"
				cy="13.5"
				rx="53"
				ry="11"
				className="fill-bottle-cap-top stroke-bottle-outline"
				strokeWidth="5"
			/>
			<ellipse cx="36.5" cy="30" rx="4.5" ry="6" className="fill-background-surface" />
		</svg>
	);
}
