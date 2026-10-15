import type { MouseEvent } from "react";
import Button from "@/components/admin/Button";
import { LIMITS } from "@/data/schema";
import { cn } from "@/utils/cn";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

const KEY_CLASS_NAME = cn(
	"flex h-30 w-46 items-center justify-center rounded-2xl border-2 border-border-default",
	"active:bg-background-canvas",
);

type PINPanelProps = {
	pinLength: number;
	isError?: boolean;
	onDigitClick?: (digit: string) => void;
	onDeleteClick?: () => void;
	onConfirmClick?: () => void;
	onCancelClick?: () => void;
	className?: string;
};

export default function PINPanel({
	pinLength,
	isError = false,
	onDigitClick,
	onDeleteClick,
	onConfirmClick,
	onCancelClick,
	className,
}: PINPanelProps) {
	function handleDigitClick(event: MouseEvent<HTMLButtonElement>) {
		const digit = event.currentTarget.dataset.digit;
		if (digit) onDigitClick?.(digit);
	}

	function renderDot(_: unknown, index: number) {
		const isFilled = !isError && index < pinLength;
		return (
			<span
				key={index}
				className={cn(
					"size-10 rounded-full",
					isFilled && "bg-text-primary",
					!isFilled && "border-3",
					!isFilled && (isError ? "border-state-error" : "border-border-default"),
				)}
			/>
		);
	}

	function renderDigitKey(digit: string) {
		return (
			<button
				key={digit}
				type="button"
				data-digit={digit}
				className={cn(
					KEY_CLASS_NAME,
					"bg-background-surface-subtle typo-admin-pin text-text-primary",
				)}
				onClick={handleDigitClick}>
				{digit}
			</button>
		);
	}

	return (
		<div
			className={cn(
				"flex w-170 flex-col items-center gap-6 rounded-3xl border-2 border-border-default",
				"bg-background-surface p-12",
				className,
			)}>
			<p className="typo-admin-title text-text-primary">관리자 모드</p>
			<p className="typo-admin-body text-text-secondary">관리자 PIN을 입력해주세요.</p>
			<div
				role="img"
				aria-label={`${LIMITS.pinLength}자리 중 ${pinLength}자리 입력`}
				className="flex h-12 items-center gap-6">
				{Array.from({ length: LIMITS.pinLength }, renderDot)}
			</div>
			<p role="alert" className="h-7.25 typo-admin-body text-state-error">
				{isError && "PIN이 올바르지 않습니다. 다시 입력해주세요."}
			</p>
			<div className="grid w-146 grid-cols-3 gap-4">
				{DIGITS.map(renderDigitKey)}
				<button
					type="button"
					className={cn(
						KEY_CLASS_NAME,
						"bg-background-surface typo-admin-label text-text-secondary",
					)}
					onClick={onDeleteClick}>
					삭제
				</button>
				{renderDigitKey("0")}
				<Button label="확인" className="h-30 w-46 rounded-2xl" onClick={onConfirmClick} />
			</div>
			<Button variant="secondary" label="취소" className="h-18 w-146" onClick={onCancelClick} />
		</div>
	);
}
