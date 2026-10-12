import type { MouseEvent } from "react";
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
		<div className={cn("flex w-full flex-col items-start gap-2", className)}>
			<div className="flex h-14 w-full items-center gap-3">
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
			<div className="flex w-full flex-wrap content-start items-start gap-3">
				{species.map(renderOption)}
			</div>
		</div>
	);
}
