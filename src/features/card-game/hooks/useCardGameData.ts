import { useEffect, useState } from "react";
import { getDataOrDefault } from "@/data/load";
import type { CardGameData } from "@/types/data";

export type CardGameSource = { cardGame: CardGameData; playDurationSeconds: number };

// 저장 데이터를 못 읽어도 게임은 기본값으로 계속 진행합니다
async function loadCardGameSource(): Promise<CardGameSource> {
	const [cardGame, common] = await Promise.all([
		getDataOrDefault("card-game"),
		getDataOrDefault("common"),
	]);
	return { cardGame, playDurationSeconds: common.playDurationSeconds };
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
