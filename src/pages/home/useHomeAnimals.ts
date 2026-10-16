import { useEffect, useState } from "react";
import { getData, getImageUrl } from "@/data/storage";
import type { HomeSlot } from "@/types/data";

export type HomeAnimalView = { src: string; name: string };
export type HomeAnimals = Partial<Record<HomeSlot, HomeAnimalView>>;

// 저장 데이터를 못 읽어도 홈 화면은 동물 없이 그대로 보여야 합니다
// getImageUrl 은 파일이 없어도 주소를 돌려주므로, 이미지 로드 실패는 AnimalSlot 이 처리합니다
async function loadHomeAnimals(): Promise<HomeAnimals> {
	try {
		const { homeAnimals, species } = await getData("common");
		const animals: HomeAnimals = {};
		for (const { slot, speciesId } of homeAnimals) {
			const found = species.find((candidate) => candidate.id === speciesId);
			if (found) animals[slot] = { src: getImageUrl(found.character), name: found.name };
		}
		return animals;
	} catch {
		return {};
	}
}

export function useHomeAnimals(): HomeAnimals {
	const [animals, setAnimals] = useState<HomeAnimals>({});

	useEffect(() => {
		let isCancelled = false;
		loadHomeAnimals().then((loaded) => {
			if (!isCancelled) setAnimals(loaded);
		});
		return () => {
			isCancelled = true;
		};
	}, []);

	return animals;
}
