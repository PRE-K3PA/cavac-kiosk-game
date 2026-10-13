import { cva } from "class-variance-authority";
import { useId } from "react";
import Button from "@/components/admin/Button";
import Checkbox from "@/components/admin/Checkbox";
import type { ProductSlot } from "@/types/data";
import { cn } from "@/utils/cn";

type ProductRowState = "on" | "off" | "empty";

const productRowVariants = cva(
	"flex h-22 w-full items-center gap-4 rounded-xl border-border-default px-4",
	{
		variants: {
			state: {
				on: "border-3 bg-background-surface-subtle",
				off: "border-2 bg-background-surface-subtle",
				empty: "border-2 bg-background-surface",
			},
		},
	},
);

const thumbnailVariants = cva(
	"flex h-18 w-30 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2",
	{
		variants: {
			isFilled: {
				true: "border-border-default bg-background-surface",
				false: "border-dashed border-border-placeholder bg-background-canvas",
			},
		},
	},
);

type ProductRowProps = Pick<ProductSlot, "slot" | "isEnabled" | "isShownInResult"> & {
	/** 없으면 사진을 아직 등록하지 않은 빈 칸으로 그립니다 */
	imageSrc?: string;
	onEnabledChange?: (isEnabled: boolean) => void;
	onShownInResultChange?: (isShownInResult: boolean) => void;
	onRegisterClick?: () => void;
	onEditClick?: () => void;
	onDeleteClick?: () => void;
	className?: string;
};

function getRowState(isFilled: boolean, isEnabled: boolean): ProductRowState {
	if (!isFilled) return "empty";
	return isEnabled ? "on" : "off";
}

export default function ProductRow({
	slot,
	isEnabled,
	isShownInResult,
	imageSrc,
	onEnabledChange,
	onShownInResultChange,
	onRegisterClick,
	onEditClick,
	onDeleteClick,
	className,
}: ProductRowProps) {
	const resultCheckboxId = useId();
	const isFilled = Boolean(imageSrc);
	const state = getRowState(isFilled, isEnabled);
	const isOn = state === "on";

	return (
		<div className={cn(productRowVariants({ state }), className)}>
			<Checkbox
				aria-label={`${slot}번 제품 사용`}
				isChecked={isOn}
				disabled={state === "empty"}
				onChange={onEnabledChange}
			/>
			<p className="w-7 shrink-0 text-center typo-admin-label text-text-secondary">{slot}</p>
			<div className={thumbnailVariants({ isFilled })}>
				{imageSrc ? (
					<img src={imageSrc} alt="" className="size-full object-contain" />
				) : (
					<span className="typo-admin-caption whitespace-nowrap text-text-placeholder">
						이미지 없음
					</span>
				)}
			</div>
			{state === "empty" ? (
				<Button
					variant="secondary"
					label="등록"
					className="ml-auto h-14 w-24 shrink-0 px-0"
					onClick={onRegisterClick}
				/>
			) : (
				<>
					<label htmlFor={resultCheckboxId} className="ml-auto flex shrink-0 items-center gap-2">
						{/* 꺼진 제품은 결과 화면에 나오지 않으므로 저장값과 관계없이 빈 칸으로 보입니다 */}
						<Checkbox
							id={resultCheckboxId}
							aria-label={`${slot}번 제품 결과 화면 표시`}
							isChecked={isOn && isShownInResult}
							disabled={!isOn}
							onChange={onShownInResultChange}
						/>
						<span
							className={cn(
								"typo-admin-body whitespace-nowrap",
								isOn ? "text-text-primary" : "text-text-disabled",
							)}>
							결과 화면 표시
						</span>
					</label>
					<Button
						variant="secondary"
						label="수정"
						className="h-14 w-24 shrink-0 px-0"
						onClick={onEditClick}
					/>
					<Button
						variant="danger"
						label="삭제"
						className="h-14 w-24 shrink-0 px-0"
						onClick={onDeleteClick}
					/>
				</>
			)}
		</div>
	);
}
