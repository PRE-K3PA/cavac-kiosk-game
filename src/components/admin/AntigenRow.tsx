import { cva } from "class-variance-authority";
import { useEffect, useId, useRef, useState } from "react";
import icInfo from "@/assets/icons/icInfo.svg";
import icPinned from "@/assets/icons/icPinned.svg";
import icUnpinned from "@/assets/icons/icUnpinned.svg";
import Button from "@/components/admin/Button";
import Checkbox from "@/components/admin/Checkbox";
import FieldMessage from "@/components/admin/FieldMessage";
import Icon from "@/components/admin/Icon";
import TextInput from "@/components/admin/TextInput";
import Tooltip from "@/components/admin/Tooltip";
import { BACTERIA_ABBR_CLASS } from "@/components/vaccine/antigen";
import { formatAntigenLabel } from "@/data/rules";
import { LIMITS } from "@/data/schema";
import type { Antigen } from "@/types/data";
import { cn } from "@/utils/cn";

const PATHOGEN_TOOLTIP = {
	title: "세균 / 바이러스 구분",
	message: "체크하면 세균으로 판정해 이탤릭으로 표시합니다",
} as const;

const antigenRowVariants = cva(
	"flex h-18 items-center gap-3 rounded-xl bg-background-surface px-3",
	{
		variants: {
			isEditing: {
				true: "border-3 border-tone-common",
				false: "border-2 border-border-default",
			},
		},
	},
);

// 수정 중이 아닐 때는 테두리 없이 아이콘만 보이지만 바로 누를 수 있습니다 (10-27 실기 테스트 QA)
const pinToggleVariants = cva(
	[
		"flex size-14 shrink-0 items-center justify-center rounded-lg active:bg-background-canvas",
		"disabled:text-text-placeholder",
	],
	{
		variants: {
			isEditing: {
				true: "border-2 border-border-strong",
				false: "",
			},
			isPinned: {
				true: "text-text-primary",
				false: "text-border-strong",
			},
		},
		compoundVariants: [
			{ isEditing: true, isPinned: true, className: "bg-background-canvas" },
			{ isEditing: true, isPinned: false, className: "bg-background-surface" },
		],
	},
);

type AntigenValue = Omit<Antigen, "id">;

function getAntigenName({ abbr, subtype }: AntigenValue) {
	const trimmedAbbr = abbr.trim();
	if (trimmedAbbr === "") return "새 항원";

	return formatAntigenLabel({ abbr: trimmedAbbr, subtype: subtype?.trim() || null });
}

type AntigenRowProps = {
	value: AntigenValue;
	isEditing: boolean;
	abbrErrorMessage?: string;
	isDoneDisabled?: boolean;
	/** 다른 행을 수정하는 동안(Q12) 잠긴 행의 고정·수정·삭제만 막습니다. ⓘ 는 막지 않습니다 */
	isPinEditDeleteDisabled?: boolean;
	onChange?: (value: AntigenValue) => void;
	/** 고정은 수정 중이 아니어도 누를 수 있고, 마지막 고정 안 된 항원인지는 화면이 판단합니다 */
	onPinClick?: () => void;
	onEditClick?: () => void;
	onDoneClick?: () => void;
	onDeleteClick?: () => void;
	className?: string;
};

export default function AntigenRow({
	value,
	isEditing,
	abbrErrorMessage,
	isDoneDisabled,
	isPinEditDeleteDisabled,
	onChange,
	onPinClick,
	onEditClick,
	onDoneClick,
	onDeleteClick,
	className,
}: AntigenRowProps) {
	const [isTooltipOpen, setIsTooltipOpen] = useState(false);
	const rowRef = useRef<HTMLDivElement>(null);
	const infoRef = useRef<HTMLDivElement>(null);
	const tooltipRef = useRef<HTMLDivElement>(null);
	const tooltipId = useId();
	const abbrMessageId = useId();
	const isBacteria = value.pathogenType === "bacteria";
	const antigenName = getAntigenName(value);

	// 팝업을 pointerdown 에서 닫으면 손을 뗄 때 click 이 팝업 아래 버튼에 떨어집니다.
	// 그래서 바깥은 pointerdown 으로, 팝업은 click 으로 닫습니다
	function subscribeTooltipDismiss() {
		if (!isTooltipOpen) return;

		function handleDocumentPointerDown(event: PointerEvent) {
			if (!infoRef.current?.contains(event.target as Node)) setIsTooltipOpen(false);
		}

		function handleDocumentClick(event: MouseEvent) {
			if (tooltipRef.current?.contains(event.target as Node)) setIsTooltipOpen(false);
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

	// 항원 추가로 목록 끝에 생긴 행이 스크롤 밖에 있어도 입력할 수 있게 보이는 곳으로 옮깁니다
	function scrollIntoViewWhenEditing() {
		if (isEditing) rowRef.current?.scrollIntoView({ block: "nearest" });
	}

	useEffect(scrollIntoViewWhenEditing, [isEditing]);

	function handleInfoClick() {
		setIsTooltipOpen(!isTooltipOpen);
	}

	function handleAbbrChange(abbr: string) {
		onChange?.({ ...value, abbr });
	}

	function handleSubtypeChange(subtype: string) {
		onChange?.({ ...value, subtype: subtype === "" ? null : subtype });
	}

	function handleBacteriaChange(isChecked: boolean) {
		onChange?.({ ...value, pathogenType: isChecked ? "bacteria" : "virus" });
	}

	return (
		<div ref={rowRef} className={cn("flex w-full flex-col gap-2", className)}>
			<div className={antigenRowVariants({ isEditing })}>
				<button
					type="button"
					aria-label={`${antigenName} 고정`}
					aria-pressed={value.isPinned}
					disabled={!isEditing && isPinEditDeleteDisabled}
					onClick={onPinClick}
					className={pinToggleVariants({ isEditing, isPinned: value.isPinned })}>
					<Icon src={value.isPinned ? icPinned : icUnpinned} />
				</button>
				{isEditing ? (
					<>
						<TextInput
							value={value.abbr}
							placeholder="약어"
							aria-label="약어"
							maxLength={LIMITS.antigenAbbr.max}
							isError={Boolean(abbrErrorMessage)}
							aria-describedby={abbrErrorMessage ? abbrMessageId : undefined}
							onChange={handleAbbrChange}
							className={cn("h-14 w-35 shrink-0 rounded-lg px-4", isBacteria && "italic")}
						/>
						<TextInput
							value={value.subtype ?? ""}
							placeholder="세부 타입"
							aria-label="세부 타입"
							onChange={handleSubtypeChange}
							className="h-14 w-0 min-w-0 flex-1 rounded-lg px-4"
						/>
					</>
				) : (
					<>
						<span
							className={cn(
								"w-35 shrink-0 truncate px-4 typo-admin-label text-text-primary",
								isBacteria && BACTERIA_ABBR_CLASS,
							)}>
							{value.abbr}
						</span>
						<span className="min-w-0 flex-1 truncate px-4 typo-admin-label text-text-secondary">
							{value.subtype?.trim() || "-"}
						</span>
					</>
				)}
				<div className="flex shrink-0 items-center gap-2">
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
					<Checkbox
						aria-label={`${antigenName} 세균`}
						isChecked={isBacteria}
						disabled={!isEditing}
						onChange={handleBacteriaChange}
					/>
				</div>
				<Button
					variant="secondary"
					label={isEditing ? "완료" : "수정"}
					disabled={isEditing ? isDoneDisabled : isPinEditDeleteDisabled}
					size="row"
					className="shrink-0"
					onClick={isEditing ? onDoneClick : onEditClick}
				/>
				<Button
					variant="danger"
					label="삭제"
					disabled={!isEditing && isPinEditDeleteDisabled}
					size="row"
					className="shrink-0"
					onClick={onDeleteClick}
				/>
			</div>
			{abbrErrorMessage && <FieldMessage id={abbrMessageId} message={abbrErrorMessage} />}
		</div>
	);
}
