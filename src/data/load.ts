import { createDefaultData } from "@/data/defaults";
import { getData } from "@/data/storage";
import type { DataFile, DataMap } from "@/types/data";

type ReadData = <F extends DataFile>(file: F) => Promise<DataMap[F]>;

/** 읽기 함수를 받아 테스트할 수 있게 나눈 본체입니다. 화면 코드는 getDataOrDefault 를 씁니다 */
export async function readWithDefault<F extends DataFile>(
	file: F,
	read: ReadData,
): Promise<DataMap[F]> {
	try {
		return await read(file);
	} catch {
		return createDefaultData(file);
	}
}

/**
 * 설정을 읽고, 읽지 못하면 기본값을 돌려줍니다. 예외를 던지지 않습니다.
 * 깨진 파일은 main 이 이미 백업이나 기본값으로 복구해 주므로, 여기서 잡는 건 IPC 연결 문제 같은 경우입니다.
 * 읽기 실패를 알아야 하는 화면(시작 막기 등)은 getData 를 그대로 씁니다
 */
export function getDataOrDefault<F extends DataFile>(file: F): Promise<DataMap[F]> {
	return readWithDefault(file, getData);
}
