import { useEffect, useId, useRef, useState } from "react";
import icInfo from "@/assets/icons/icInfo.svg";
import Icon from "@/components/admin/Icon";
import Tooltip from "@/components/admin/Tooltip";
import { cn } from "@/utils/cn";

const PATHOGEN_TOOLTIP = {
	title: "세균 / 바이러스 구분",
	message: "체크하면 세균으로 판정해 이탤릭으로 표시합니다",
} as const;

type PathogenInfoButtonProps = {
	antigenName: string;
};

export default function PathogenInfoButton({ antigenName }: PathogenInfoButtonProps) {
	const [isTooltipOpen, setIsTooltipOpen] = useState(false);
	const infoRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const tooltipId = useId();

	// 팝업을 pointerdown 에서 닫으면 손을 뗄 때 click 이 팝업 아래 버튼에 떨어집니다.
	// 그래서 바깥은 pointerdown 으로, 팝업은 click 으로 닫습니다
	function subscribeTooltipDismiss() {
		if (!isTooltipOpen) return;

		function handleDocumentPointerDown({ target }: PointerEvent) {
			if (target instanceof Node && infoRef.current?.contains(target)) return;
			setIsTooltipOpen(false);
		}

		function handleDocumentClick({ target }: MouseEvent) {
			if (target instanceof Node && tooltipRef.current?.contains(target)) setIsTooltipOpen(false);
		}

		function unsubscribe() {
			document.removeEventListener("pointerdown", handleDocumentPointerDown);
			document.removeEventListener("click", handleDocumentClick);
		}

		document.addEventListener("pointerdown", handleDocumentPointerDown);
		document.addEventListener("click", handleDocumentClick);
		return unsubscribe;
	}

	useEffect(subscribeTooltipDismiss, [isTooltipOpen]);

	function handleInfoClick() {
		setIsTooltipOpen((isOpen) => !isOpen);
	}

	return (
		<div ref={infoRef} className="relative">
			<button
				type="button"
				aria-label={`${antigenName} ${PATHOGEN_TOOLTIP.title}`}
				aria-expanded={isTooltipOpen}
				aria-describedby={isTooltipOpen ? tooltipId : undefined}
				onClick={handleInfoClick}
				className={cn(
					"flex size-9 items-center justify-center rounded-full text-text-secondary",
					"active:bg-background-canvas",
				)}>
				<Icon src={icInfo} />
			</button>
			{isTooltipOpen && (
				<div
					ref={tooltipRef}
					className="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2">
					<Tooltip
						id={tooltipId}
						title={PATHOGEN_TOOLTIP.title}
						message={PATHOGEN_TOOLTIP.message}
					/>
				</div>
			)}
		</div>
	);
}
