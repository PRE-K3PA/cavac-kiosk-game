import type { ReactNode } from "react";
import useStageScale from "@/hooks/useStageScale";
import { OrientationProvider } from "@/layout/OrientationContext";
import { STAGE_SIZE } from "@/layout/stage";

type KioskStageProps = {
	children: ReactNode;
};

export default function KioskStage({ children }: KioskStageProps) {
	const { orientation, scale } = useStageScale();
	const stage = STAGE_SIZE[orientation];

	return (
		<div className="flex size-full items-center justify-center overflow-hidden bg-background-canvas">
			<div
				className="relative shrink-0 overflow-hidden"
				style={{ width: stage.width * scale, height: stage.height * scale }}>
				<div
					className="absolute top-0 left-0 origin-top-left"
					style={{ width: stage.width, height: stage.height, transform: `scale(${scale})` }}>
					<OrientationProvider orientation={orientation}>{children}</OrientationProvider>
				</div>
			</div>
		</div>
	);
}
