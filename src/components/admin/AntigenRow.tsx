import { cva } from "class-variance-authority";
import { useEffect, useId, useRef, useState } from "react";
import icInfo from "@/assets/images/icInfo.svg";
import icPinned from "@/assets/images/icPinned.svg";
import icUnpinned from "@/assets/images/icUnpinned.svg";
import Button from "@/components/admin/Button";
import Checkbox from "@/components/admin/Checkbox";
import FieldMessage from "@/components/admin/FieldMessage";
import Icon from "@/components/admin/Icon";
import TextInput from "@/components/admin/TextInput";
import Tooltip from "@/components/admin/Tooltip";
import { BACTERIA_ABBR_CLASS } from "@/components/vaccine/antigen";
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

const pinToggleVariants = cva("flex size-14 shrink-0 items-center justify-center rounded-lg", {
	variants: {
		isEditing: {
			true: "border-2 border-border-strong active:bg-background-canvas",
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
});

type AntigenValue = Omit<Antigen, "id">;

type AntigenRowProps = {
	value: AntigenValue;
	isEditing: boolean;
	abbrErrorMessage?: string;
	onChange?: (value: AntigenValue) => void;
	onEditClick?: () => void;
	onDoneClick?: () => void;
	onDeleteClick?: () => void;
	className?: string;
};

export default function AntigenRow({
	value,
	isEditing,
	abbrErrorMessage,
	onChange,
	onEditClick,
	onDoneClick,
	onDeleteClick,
	className,
}: AntigenRowProps) {
	const [isTooltipOpen, setIsTooltipOpen] = useState(false);
	const infoButtonRef = useRef<HTMLButtonElement>(null);
	const tooltipId = useId();
	const abbrMessageId = useId();
	const isBacteria = value.pathogenType === "bacteria";

	function subscribeOutsidePointerDown() {
		if (!isTooltipOpen) return;

		function handleDocumentPointerDown(event: PointerEvent) {
			if (!infoButtonRef.current?.contains(event.target as Node)) setIsTooltipOpen(false);
		}

		function unsubscribe() {
			document.removeEventListener("pointerdown", handleDocumentPointerDown);
		}

		document.addEventListener("pointerdown", handleDocumentPointerDown);
		return unsubscribe;
	}

	useEffect(subscribeOutsidePointerDown, [isTooltipOpen]);

	function handleInfoClick() {
		setIsTooltipOpen(!isTooltipOpen);
	}

	function handlePinClick() {
		onChange?.({ ...value, isPinned: !value.isPinned });
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
		<div className={cn("flex w-full flex-col gap-2", className)}>
			<div className={antigenRowVariants({ isEditing })}>
				<button
					type="button"
					aria-label={`${value.abbr} 고정`}
					aria-pressed={value.isPinned}
					disabled={!isEditing}
					onClick={handlePinClick}
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
							className="h-14 min-w-0 flex-1 rounded-lg px-4"
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
					<div className="relative">
						<button
							ref={infoButtonRef}
							type="button"
							aria-label={PATHOGEN_TOOLTIP.title}
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
							<Tooltip
								id={tooltipId}
								title={PATHOGEN_TOOLTIP.title}
								message={PATHOGEN_TOOLTIP.message}
								className="absolute bottom-full left-1/2 z-10 mb-1.5 -translate-x-1/2"
							/>
						)}
					</div>
					<Checkbox
						aria-label={`${value.abbr} 세균`}
						isChecked={isBacteria}
						disabled={!isEditing}
						onChange={handleBacteriaChange}
					/>
				</div>
				<Button
					variant="secondary"
					label={isEditing ? "완료" : "수정"}
					className="h-14 w-24 shrink-0 px-0"
					onClick={isEditing ? onDoneClick : onEditClick}
				/>
				<Button
					variant="danger"
					label="삭제"
					className="h-14 w-24 shrink-0 px-0"
					onClick={onDeleteClick}
				/>
			</div>
			{abbrErrorMessage && <FieldMessage id={abbrMessageId} message={abbrErrorMessage} />}
		</div>
	);
}
