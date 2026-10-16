import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import icChevron from "@/assets/icons/icChevron.svg";
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

const LIST_GAP = 8;

type ListPosition = {
	left: number;
	top: number;
	width: number;
	scale: number;
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
	const [listPosition, setListPosition] = useState<ListPosition | null>(null);
	const fieldRef = useRef<HTMLButtonElement>(null);
	const listRef = useRef<HTMLDivElement>(null);
	const isOpen = listPosition !== null;
	const selected = options.find(isSelectedOption);

	function isSelectedOption(option: SelectOption<T>) {
		return option.value === value;
	}

	function subscribeCloseTriggers() {
		if (!isOpen) return;

		function close() {
			setListPosition(null);
		}

		function handleDocumentPointerDown(event: PointerEvent) {
			const target = event.target as Node;
			if (fieldRef.current?.contains(target) || listRef.current?.contains(target)) return;
			close();
		}

		function handleDocumentScroll(event: Event) {
			if (!listRef.current?.contains(event.target as Node)) close();
		}

		function unsubscribe() {
			document.removeEventListener("pointerdown", handleDocumentPointerDown);
			document.removeEventListener("scroll", handleDocumentScroll, true);
			window.removeEventListener("resize", close);
		}

		document.addEventListener("pointerdown", handleDocumentPointerDown);
		document.addEventListener("scroll", handleDocumentScroll, true);
		window.addEventListener("resize", close);
		return unsubscribe;
	}

	useEffect(subscribeCloseTriggers, [isOpen]);

	// 무대가 transform: scale 로 그려지므로 화면상 크기와 원래 크기의 비로 배율을 구한다
	function measureListPosition(field: HTMLButtonElement): ListPosition {
		const rect = field.getBoundingClientRect();
		const scale = rect.width / field.offsetWidth;
		return {
			left: rect.left,
			top: rect.bottom + LIST_GAP * scale,
			width: field.offsetWidth,
			scale,
		};
	}

	function handleFieldClick() {
		if (isOpen || !fieldRef.current) {
			setListPosition(null);
			return;
		}
		setListPosition(measureListPosition(fieldRef.current));
	}

	function handleOptionSelect(next: T) {
		setListPosition(null);
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
		<div className={cn("w-45", className)}>
			<button
				ref={fieldRef}
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
			{listPosition &&
				createPortal(
					<div
						ref={listRef}
						style={{
							left: listPosition.left,
							top: listPosition.top,
							width: listPosition.width,
							transform: `scale(${listPosition.scale})`,
						}}
						className={cn(
							"fixed z-50 max-h-43 origin-top-left overflow-y-auto",
							"rounded-xl border-2 border-border-default bg-background-surface shadow-md",
						)}>
						{options.map(renderOption)}
					</div>,
					document.body,
				)}
		</div>
	);
}
