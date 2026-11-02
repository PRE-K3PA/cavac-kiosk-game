import type { ReactNode } from "react";
import AdminHotspot from "@/components/common/AdminHotspot";
import { cn } from "@/utils/cn";

type ScreenLayoutProps = {
	onAdminActivate: () => void;
	/** 기본 배경(하늘색) 대신 깔 배경. 홈 화면의 농장 일러스트처럼 화면이 정한다 */
	background?: ReactNode;
	children: ReactNode;
	/** 본문 영역의 정렬, 간격, 여백. 방향별 값은 화면이 정한다 */
	className?: string;
};

export default function ScreenLayout({
	onAdminActivate,
	background,
	children,
	className,
}: ScreenLayoutProps) {
	return (
		<div className="relative size-full overflow-hidden bg-background-canvas">
			{background && (
				<div aria-hidden="true" className="pointer-events-none absolute inset-0">
					{background}
				</div>
			)}
			<div className={cn("relative flex size-full flex-col", className)}>{children}</div>
			{/* 홈 로고(세로 화면 기준 오른쪽 끝 x328, 아래 끝 y124)를 여유 있게 덮는 크기 */}
			<AdminHotspot onActivate={onAdminActivate} className="absolute top-0 left-0 h-55 w-90" />
		</div>
	);
}
