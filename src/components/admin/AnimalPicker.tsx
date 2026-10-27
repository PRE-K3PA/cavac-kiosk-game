import { type MouseEvent, type UIEvent, useEffect, useRef, useState } from "react";
import AnimalOption from "@/components/admin/AnimalOption";
import Button from "@/components/admin/Button";
import { cn } from "@/utils/cn";

type PickerSpecies = {
	id: string;
	name: string;
	imageSrc: string;
};

type AnimalPickerProps = {
	species: readonly PickerSpecies[];
	slotLabel?: string;
	currentSpeciesId?: string;
	onSpeciesSelect?: (speciesId: string) => void;
	onClearClick?: () => void;
	className?: string;
};

function getHeadMessage(slotLabel?: string, currentSpeciesId?: string) {
	if (!slotLabel) return "칸을 먼저 고르세요";
	if (currentSpeciesId) return `${slotLabel} 칸 · 바꾸거나 비우세요`;
	return `${slotLabel} 칸에 세울 동물을 고르세요`;
}

// 1px 은 배율 때문에 생기는 소수점 오차를 넘기기 위한 여유입니다
function hasHiddenContentBelow(element: HTMLElement) {
	return element.scrollHeight - element.scrollTop - element.clientHeight > 1;
}

export default function AnimalPicker({
	species,
	slotLabel,
	currentSpeciesId,
	onSpeciesSelect,
	onClearClick,
	className,
}: AnimalPickerProps) {
	const isIdle = !slotLabel;
	const isFilledSlot = !isIdle && Boolean(currentSpeciesId);
	const listRef = useRef<HTMLDivElement>(null);
	const gridRef = useRef<HTMLDivElement>(null);
	const [isFadeVisible, setIsFadeVisible] = useState(false);

	// 축종이 늘어 칸 크기는 그대로인 채 내용만 길어질 때도 알 수 있게 안쪽 grid 도 지켜봅니다
	useEffect(() => {
		const list = listRef.current;
		const grid = gridRef.current;
		if (!list || !grid) return;
		const observer = new ResizeObserver(() => setIsFadeVisible(hasHiddenContentBelow(list)));
		observer.observe(list);
		observer.observe(grid);
		return () => observer.disconnect();
	}, []);

	function handleListScroll(event: UIEvent<HTMLDivElement>) {
		setIsFadeVisible(hasHiddenContentBelow(event.currentTarget));
	}

	function handleOptionClick(event: MouseEvent<HTMLButtonElement>) {
		const speciesId = event.currentTarget.dataset.speciesId;
		if (speciesId) onSpeciesSelect?.(speciesId);
	}

	function renderOption(item: PickerSpecies) {
		return (
			<AnimalOption
				key={item.id}
				data-species-id={item.id}
				name={item.name}
				imageSrc={item.imageSrc}
				isSelected={isFilledSlot && item.id === currentSpeciesId}
				disabled={isIdle}
				onClick={handleOptionClick}
			/>
		);
	}

	return (
		<div className={cn("flex min-h-0 w-full flex-col items-start gap-2", className)}>
			<div className="flex h-14 w-full shrink-0 items-center gap-3">
				<p
					className={cn(
						"typo-admin-label whitespace-nowrap",
						isIdle ? "text-text-secondary" : "text-text-primary",
					)}>
					{getHeadMessage(slotLabel, currentSpeciesId)}
				</p>
				{isFilledSlot && (
					<Button
						variant="danger"
						label="칸 비우기"
						className="ml-auto h-14"
						onClick={onClearClick}
					/>
				)}
			</div>
			<div className="relative flex min-h-0 w-full flex-col">
				<div
					ref={listRef}
					onScroll={handleListScroll}
					className="min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:none]">
					<div
						ref={gridRef}
						className="grid grid-cols-[repeat(auto-fill,144px)] justify-center gap-3">
						{species.map(renderOption)}
					</div>
				</div>
				{/* 스크롤바를 숨겨 두어서, 아래에 줄이 더 있으면 흐리게 덮어 알립니다 */}
				{isFadeVisible && (
					<div
						className={cn(
							"pointer-events-none absolute inset-x-0 bottom-0 h-20",
							"bg-linear-to-b from-transparent to-background-surface",
						)}
					/>
				)}
			</div>
		</div>
	);
}
