import { useEffect, useState } from "react";
import { collectSaveIssues } from "@/data/rules";
import { getData } from "@/data/storage";
import type { DataFile } from "@/types/data";

type GameDataFile = Extract<DataFile, "vaccine-game" | "card-game">;

// 관리자 화면이 저장을 막는 데이터(카드 쌍 수와 켜진 제품 수가 다름, 켜진 백신 수가 범위 밖 등)로는
// 게임을 시작하지 않습니다. 확인하기 전이나 읽기에 실패했을 때도 시작하지 않습니다
async function loadCanStart(file: GameDataFile): Promise<boolean> {
	try {
		return collectSaveIssues(file, await getData(file)).length === 0;
	} catch {
		return false;
	}
}

export function useCanStart(file: GameDataFile): boolean {
	const [canStart, setCanStart] = useState(false);

	useEffect(() => {
		let isCancelled = false;
		loadCanStart(file).then((loaded) => {
			if (!isCancelled) setCanStart(loaded);
		});
		return () => {
			isCancelled = true;
		};
	}, [file]);

	return canStart;
}
