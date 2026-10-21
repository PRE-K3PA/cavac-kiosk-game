import { useEffect, useState } from "react";
import { createDefaultData } from "@/data/defaults";
import { getData } from "@/data/storage";
import type { CardGameData, CommonData, DataFile, DataMap } from "@/types/data";

export type CardGameSource = { cardGame: CardGameData; playDurationSeconds: number };

// 저장 데이터를 못 읽어도 게임은 기본값으로 계속 진행합니다
async function loadOrDefault<F extends DataFile>(file: F): Promise<DataMap[F]> {
	try {
		return await getData(file);
	} catch {
		return createDefaultData(file);
	}
}

async function readCardGameSource(): Promise<CardGameSource> {
	const [cardGame, common]: [CardGameData, CommonData] = await Promise.all([
		loadOrDefault("card-game"),
		loadOrDefault("common"),
	]);
	return { cardGame, playDurationSeconds: common.playDurationSeconds };
}

// loadOrDefault 밖에서 예외가 나도 화면이 멈추지 않게 마지막으로 기본값을 돌려줍니다
async function loadCardGameSource(): Promise<CardGameSource> {
	try {
		return await readCardGameSource();
	} catch {
		return {
			cardGame: createDefaultData("card-game"),
			playDurationSeconds: createDefaultData("common").playDurationSeconds,
		};
	}
}

export function useCardGameData(): CardGameSource | null {
	const [source, setSource] = useState<CardGameSource | null>(null);

	useEffect(() => {
		let isCancelled = false;
		loadCardGameSource().then((loaded) => {
			if (!isCancelled) setSource(loaded);
		});
		return () => {
			isCancelled = true;
		};
	}, []);

	return source;
}
