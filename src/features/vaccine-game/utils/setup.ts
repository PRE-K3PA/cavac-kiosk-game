import { createDefaultData } from "@/data/defaults";
import { readWithDefault } from "@/data/load";
import { getData } from "@/data/storage";
import {
	type AntigenColors,
	assignAntigenColors,
} from "@/features/vaccine-game/utils/antigenColors";
import { getRoundVaccines } from "@/features/vaccine-game/utils/round";
import type { CommonData, DataFile, DataMap, Vaccine, VaccineGameSettings } from "@/types/data";

export type DataReader = <F extends DataFile>(file: F) => Promise<DataMap[F]>;

export type GameSetup = {
	round: Vaccine[];
	allVaccines: Vaccine[];
	settings: VaccineGameSettings;
	playDurationSeconds: number;
	autoReset: CommonData["autoReset"];
	colors: AntigenColors;
};

function toSetup(
	{ vaccines, settings }: DataMap["vaccine-game"],
	{ playDurationSeconds, autoReset }: CommonData,
): GameSetup {
	const round = getRoundVaccines(vaccines);
	return {
		round,
		allVaccines: vaccines,
		settings,
		playDurationSeconds,
		autoReset,
		colors: assignAntigenColors(round, vaccines, Math.random),
	};
}

/**
 * 게임을 시작할 때마다 저장된 설정을 읽어, 관리자 화면에서 저장한 값이 다음 판부터 반영됩니다.
 * 읽지 못하면 기본값(켜진 백신 없음)으로 돌려주고, 화면은 대기 화면으로 돌아갑니다
 */
export async function loadSetup(read: DataReader = getData): Promise<GameSetup> {
	try {
		const [vaccineGame, common] = await Promise.all([
			readWithDefault("vaccine-game", read),
			readWithDefault("common", read),
		]);
		return toSetup(vaccineGame, common);
	} catch {
		return toSetup(createDefaultData("vaccine-game"), createDefaultData("common"));
	}
}
