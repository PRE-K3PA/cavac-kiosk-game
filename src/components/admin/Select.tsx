import { useEffect, useRef, useState } from "react";
import icChevron from "@/assets/images/icChevron.svg";
import Icon from "@/components/admin/Icon";
import { cn } from "@/utils/cn";

type SelectValue = string | number;

type SelectOption<T extends SelectValue> = {
	value: T;
	label: string;
};

type SelectProps<T extends SelectValue> = {
	options: readonly SelectOption<T>[];
	value: T;
	label?: string;
	disabled?: boolean;
	onChange?: (value: T) => void;
	className?: string;
};

type SelectOptionButtonProps<T extends SelectValue> = {
	option: SelectOption<T>;
	isSelected: boolean;
	onSelect: (value: T) => void;
};

function SelectOptionButton<T extends SelectValue>({
	option,
	isSelected,
	onSelect,
}: SelectOptionButtonProps<T>) {
	function handleOptionClick() {
		onSelect(option.value);
	}

	return (
		<button
			type="button"
			aria-pressed={isSelected}
			onClick={handleOptionClick}
			className={cn(
				"flex h-14 w-full items-center px-5",
				"typo-admin-label whitespace-nowrap text-text-primary",
				"active:bg-background-canvas",
				isSelected && "bg-background-canvas",
			)}>
			{option.label}
		</button>
	);
}

export default function Select<T extends SelectValue>({
	options,
	value,
	label,
	disabled = false,
	onChange,
	className,
}: SelectProps<T>) {
	const [isOpen, setIsOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const selected = options.find(isSelectedOption);

	function isSelectedOption(option: SelectOption<T>) {
		return option.value === value;
	}

	function subscribeOutsidePointerDown() {
		if (!isOpen) return;

		function handleDocumentPointerDown(event: PointerEvent) {
			if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
		}

		function unsubscribe() {
			document.removeEventListener("pointerdown", handleDocumentPointerDown);
		}

		document.addEventListener("pointerdown", handleDocumentPointerDown);
		return unsubscribe;
	}

	useEffect(subscribeOutsidePointerDown, [isOpen]);

	function handleFieldClick() {
		setIsOpen(!isOpen);
	}

	function handleOptionSelect(next: T) {
		setIsOpen(false);
		if (next !== value) onChange?.(next);
	}

	function renderOption(option: SelectOption<T>) {
		return (
			<SelectOptionButton
				key={option.value}
				option={option}
				isSelected={option.value === value}
				onSelect={handleOptionSelect}
			/>
		);
	}

	return (
		<div ref={rootRef} className={cn("relative w-45", className)}>
			<button
				type="button"
				aria-label={label}
				aria-expanded={isOpen}
				disabled={disabled}
				onClick={handleFieldClick}
				className={cn(
					"flex h-16 w-full items-center gap-3 rounded-xl bg-background-surface px-5 text-left",
					"disabled:border-border-muted disabled:bg-background-muted disabled:opacity-40",
					isOpen ? "border-3 border-tone-common" : "border-2 border-border-default",
				)}>
				<span className="min-w-0 flex-1 truncate typo-admin-label text-text-primary">
					{selected?.label ?? ""}
				</span>
				<Icon src={icChevron} className={cn("size-5 bg-border-strong", isOpen && "rotate-180")} />
			</button>
			{isOpen && (
				<div
					className={cn(
						"absolute top-full right-0 left-0 z-10 mt-2 flex flex-col overflow-hidden",
						"rounded-xl border-2 border-border-default bg-background-surface py-2 shadow-md",
					)}>
					{options.map(renderOption)}
				</div>
			)}
		</div>
	);
}
