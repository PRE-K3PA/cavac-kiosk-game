import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import icChevron from "@/assets/icons/icChevron.svg";
import AddButton from "@/components/admin/AddButton";
import Button from "@/components/admin/Button";
import Checkbox from "@/components/admin/Checkbox";
import Icon from "@/components/admin/Icon";
import { LIMITS } from "@/data/schema";
import type { Vaccine } from "@/types/data";
import { cn } from "@/utils/cn";

const MAX_ANTIGENS = LIMITS.antigensPerVaccine.max;

const vaccineRowVariants = cva(
	"flex w-219 flex-col gap-3 rounded-2xl bg-background-surface-subtle px-4 py-3",
	{
		variants: {
			isExpanded: {
				true: "border-3 border-border-strong",
				false: "border-2 border-border-default",
			},
		},
	},
);

type VaccineRowProps = {
	productName: Vaccine["productName"];
	imageSrc: string;
	antigenCount: number;
	isEnabled: boolean;
	/** 항원을 수정하는 동안 사용 체크·펼치기·수정·삭제·항원 추가를 모두 막습니다. 항원 행은 막지 않습니다 */
	disabled?: boolean;
	isExpanded: boolean;
	/** 펼쳤을 때 "항원 구성" 아래에 놓을 AntigenRow 들 */
	children?: ReactNode;
	onEnabledChange?: (isEnabled: boolean) => void;
	onAntigenToggleClick?: () => void;
	onEditClick?: () => void;
	onDeleteClick?: () => void;
	onAddAntigenClick?: () => void;
	className?: string;
};

export default function VaccineRow({
	productName,
	imageSrc,
	antigenCount,
	isEnabled,
	disabled,
	isExpanded,
	children,
	onEnabledChange,
	onAntigenToggleClick,
	onEditClick,
	onDeleteClick,
	onAddAntigenClick,
	className,
}: VaccineRowProps) {
	return (
		<div className={cn(vaccineRowVariants({ isExpanded }), className)}>
			<div className="flex h-16 items-center gap-4">
				<Checkbox
					aria-label={`${productName.ko} 사용`}
					isChecked={isEnabled}
					disabled={disabled}
					onChange={onEnabledChange}
				/>
				<div
					className={cn(
						"size-14 shrink-0 overflow-hidden rounded-lg",
						"border-2 border-border-default bg-background-surface",
					)}>
					<img src={imageSrc} alt="" className="size-full object-contain" />
				</div>
				<div className="flex min-w-0 flex-1 flex-col gap-0.5">
					<p className="truncate typo-admin-label text-text-primary">{productName.ko}</p>
					<p className="truncate typo-admin-caption text-text-secondary">{productName.en}</p>
				</div>
				<button
					type="button"
					aria-expanded={isExpanded}
					disabled={disabled}
					onClick={onAntigenToggleClick}
					className={cn(
						"flex h-14 shrink-0 items-center gap-2 rounded-xl border-2 border-border-default px-4",
						"typo-admin-label whitespace-nowrap text-text-primary active:bg-background-canvas",
						isExpanded ? "bg-background-canvas" : "bg-background-surface",
						"disabled:border-border-muted disabled:bg-background-muted",
						"disabled:text-text-placeholder",
					)}>
					항원 {antigenCount}개
					<Icon
						src={icChevron}
						className={cn("size-5 text-border-strong", isExpanded && "rotate-180")}
					/>
				</button>
				<Button
					variant="secondary"
					label="수정"
					size="row"
					disabled={disabled}
					className="shrink-0"
					onClick={onEditClick}
				/>
				<Button
					variant="danger"
					label="삭제"
					size="row"
					disabled={disabled}
					className="shrink-0"
					onClick={onDeleteClick}
				/>
			</div>
			{isExpanded && (
				<div className="flex flex-col gap-2">
					<div className="flex h-8 items-center justify-between typo-admin-body">
						<p className="text-text-primary">항원 구성</p>
						<p className="text-text-secondary">
							{antigenCount} / {MAX_ANTIGENS}
						</p>
					</div>
					{children}
					<AddButton
						label="항원 추가"
						disabled={disabled || antigenCount >= MAX_ANTIGENS}
						onClick={onAddAntigenClick}
						className="w-full"
					/>
				</div>
			)}
		</div>
	);
}
