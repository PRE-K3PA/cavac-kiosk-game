import { createDefaultData } from "@/data/defaults";
import { getData } from "@/data/storage";
import {
	type AntigenColors,
	assignAntigenColors,
} from "@/features/vaccine-game/utils/antigenColors";
import { getRoundVaccines } from "@/features/vaccine-game/utils/round";
import type { DataFile, DataMap, Vaccine, VaccineGameSettings } from "@/types/data";

export type DataReader = <F extends DataFile>(file: F) => Promise<DataMap[F]>;

export type GameSetup = {
	round: Vaccine[];
	allVaccines: Vaccine[];
	settings: VaccineGameSettings;
	playDurationSeconds: number;
	colors: AntigenColors;
};

// getData 는 async 가 아니라 Promise 를 돌려주기 전에 바로 던질 수 있어서 await 로 감싸 받습니다
async function readOrDefault<F extends DataFile>(read: DataReader, file: F): Promise<DataMap[F]> {
	try {
		return await read(file);
	} catch {
		return createDefaultData(file);
	}
}

function toSetup(vaccines: Vaccine[], settings: VaccineGameSettings, playDurationSeconds: number) {
	const round = getRoundVaccines(vaccines);
	return {
		round,
		allVaccines: vaccines,
		settings,
		playDurationSeconds,
		colors: assignAntigenColors(round, Math.random),
	};
}

/**
 * 게임을 시작할 때마다 저장된 설정을 읽어, 관리자 화면에서 저장한 값이 다음 판부터 반영됩니다.
 * 읽지 못하면 기본값(켜진 백신 없음)으로 돌려주고, 화면은 대기 화면으로 돌아갑니다
 */
export async function loadSetup(read: DataReader = getData): Promise<GameSetup> {
	try {
		const [vaccineGame, common] = await Promise.all([
			readOrDefault(read, "vaccine-game"),
			readOrDefault(read, "common"),
		]);
		return toSetup(vaccineGame.vaccines, vaccineGame.settings, common.playDurationSeconds);
	} catch {
		const { vaccines, settings } = createDefaultData("vaccine-game");
		return toSetup(vaccines, settings, createDefaultData("common").playDurationSeconds);
	}
}
