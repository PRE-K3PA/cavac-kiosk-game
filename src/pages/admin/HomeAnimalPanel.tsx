import { useState } from "react";
import AnimalPicker from "@/components/admin/AnimalPicker";
import Button from "@/components/admin/Button";
import HomeAnimalSlot from "@/components/admin/HomeAnimalSlot";
import SectionHeader from "@/components/admin/SectionHeader";
import {
	clearHomeAnimal,
	findHomeAnimal,
	HOME_SLOT_LABEL,
	placeHomeAnimal,
} from "@/features/admin/homeAnimals";
import { useSettingsDraft } from "@/features/admin/settingsDraft";
import { toSpeciesOptions } from "@/features/admin/speciesForm";
import { useOrientation } from "@/layout/OrientationContext";
import HomePreviewOverlay from "@/pages/admin/HomePreviewOverlay";
import SpeciesManagerFlow from "@/pages/admin/SpeciesManagerFlow";
import type { HomeAnimal, HomeSlot } from "@/types/data";
import { cn } from "@/utils/cn";

const LAYOUT = {
	landscape: { panel: "w-192" },
	portrait: { panel: "w-full" },
} as const;

const SLOT_GROUPS = [
	["left-2", "left-1"],
	["right-1", "right-2"],
] as const satisfies readonly (readonly HomeSlot[])[];

export default function HomeAnimalPanel() {
	const [selectedSlot, setSelectedSlot] = useState<HomeSlot | null>(null);
	const [isSpeciesManagerOpen, setIsSpeciesManagerOpen] = useState(false);
	const [isHomePreviewOpen, setIsHomePreviewOpen] = useState(false);
	const layout = LAYOUT[useOrientation()];

	const common = useSettingsDraft((state) => state.draft.common);
	const setDraft = useSettingsDraft((state) => state.setDraft);

	const pickerSpecies = toSpeciesOptions(common.species);
	const selectedSpeciesId = selectedSlot
		? findHomeAnimal(common.homeAnimals, selectedSlot)?.speciesId
		: undefined;

	function getSlotAnimal(slot: HomeSlot) {
		const speciesId = findHomeAnimal(common.homeAnimals, slot)?.speciesId;
		return pickerSpecies.find((species) => species.id === speciesId);
	}

	function updateHomeAnimals(homeAnimals: HomeAnimal[]) {
		setDraft("common", { ...common, homeAnimals });
		setSelectedSlot(null);
	}

	function handleSlotClick(slot: HomeSlot) {
		setSelectedSlot((current) => (current === slot ? null : slot));
	}

	function handleSpeciesSelect(speciesId: string) {
		if (!selectedSlot) return;
		updateHomeAnimals(placeHomeAnimal(common.homeAnimals, selectedSlot, speciesId));
	}

	function handleSlotClearClick() {
		if (!selectedSlot) return;
		updateHomeAnimals(clearHomeAnimal(common.homeAnimals, selectedSlot));
	}

	function handleSpeciesManagerOpen() {
		setSelectedSlot(null);
		setIsSpeciesManagerOpen(true);
	}

	function handleSpeciesManagerClose() {
		setIsSpeciesManagerOpen(false);
	}

	function handleHomePreviewOpen() {
		setSelectedSlot(null);
		setIsHomePreviewOpen(true);
	}

	function handleHomePreviewClose() {
		setIsHomePreviewOpen(false);
	}

	return (
		<section
			className={cn(
				"flex flex-col gap-3 rounded-2xl border-2 border-border-default bg-background-surface p-5",
				layout.panel,
			)}>
			<div className="flex items-center gap-3">
				<SectionHeader title="축종 설정" className="flex-1" />
				<Button
					variant="secondary"
					label="미리보기"
					disabled={common.homeAnimals.length === 0}
					onClick={handleHomePreviewOpen}
					className="h-16 w-40"
				/>
				<Button
					variant="secondary"
					label="축종 관리"
					onClick={handleSpeciesManagerOpen}
					className="h-16 w-40"
				/>
			</div>
			<div
				className={cn(
					"flex items-center justify-center gap-12 rounded-2xl border-2 border-border-default",
					"bg-background-canvas px-6 py-4",
				)}>
				{SLOT_GROUPS.map((slots) => (
					<div key={slots[0]} className="flex items-start gap-3">
						{slots.map((slot) => (
							<HomeAnimalSlot
								key={slot}
								slotLabel={HOME_SLOT_LABEL[slot]}
								animal={getSlotAnimal(slot)}
								isSelected={slot === selectedSlot}
								onClick={() => handleSlotClick(slot)}
							/>
						))}
					</div>
				))}
			</div>
			<AnimalPicker
				species={pickerSpecies}
				slotLabel={selectedSlot ? HOME_SLOT_LABEL[selectedSlot] : undefined}
				currentSpeciesId={selectedSpeciesId}
				onSpeciesSelect={handleSpeciesSelect}
				onClearClick={handleSlotClearClick}
			/>
			{isSpeciesManagerOpen && <SpeciesManagerFlow onClose={handleSpeciesManagerClose} />}
			{isHomePreviewOpen && <HomePreviewOverlay onClose={handleHomePreviewClose} />}
		</section>
	);
}
