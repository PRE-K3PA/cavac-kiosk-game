import { copyFile, mkdir, readFile, rename } from "node:fs/promises";
import path from "node:path";
import { createDefaultData } from "@/data/defaults";
import { validateForSave } from "@/data/rules";
import { dataSchemas } from "@/data/schema";
import type { DataFile, DataMap, SaveResult } from "@/types/data";
import { writeFileAtomically } from "./atomic-write";
import { retryOnFileLock } from "./retry";

export type DataStore = {
	read<F extends DataFile>(file: F): Promise<DataMap[F]>;
	write<F extends DataFile>(file: F, data: unknown): Promise<SaveResult<F>>;
	/** 지금까지 들어온 읽기, 쓰기가 모두 끝나면 풀립니다 */
	flush(): Promise<void>;
};

export function createDataStore(dataDir: string): DataStore {
	const queues = new Map<DataFile, Promise<unknown>>();

	function getFilePaths(file: DataFile) {
		const original = path.join(dataDir, `${file}.json`);
		return { original, backup: `${original}.bak` };
	}

	// 같은 파일을 동시에 쓰면 .tmp 가 섞이므로 파일마다 차례로 처리합니다
	function enqueue<T>(file: DataFile, task: () => Promise<T>): Promise<T> {
		const result = (queues.get(file) ?? Promise.resolve()).then(task);
		queues.set(
			file,
			result.catch(() => undefined),
		);
		return result;
	}

	async function readValidFile<F extends DataFile>(
		file: F,
		filePath: string,
	): Promise<DataMap[F] | undefined> {
		try {
			const parsed = dataSchemas[file].safeParse(JSON.parse(await readFile(filePath, "utf8")));
			return parsed.success ? (parsed.data as DataMap[F]) : undefined;
		} catch {
			return undefined;
		}
	}

	// 쓸 수 없는 원본도 사람이 열어 되살릴 수 있도록 지우지 않고 옆으로 옮깁니다
	async function moveAsideUnreadable(original: string): Promise<boolean> {
		try {
			await retryOnFileLock(() => rename(original, `${original}.corrupt-${Date.now()}`));
			return true;
		} catch (error) {
			return error instanceof Error && "code" in error && error.code === "ENOENT";
		}
	}

	async function writeFileSafely<F extends DataFile>(file: F, data: DataMap[F]): Promise<void> {
		const { original, backup } = getFilePaths(file);
		await mkdir(dataDir, { recursive: true });

		// 깨진 원본으로 멀쩡한 .bak 을 덮지 않도록, 원본이 쓸 수 있는 값일 때만 백업합니다
		if (await readValidFile(file, original)) {
			await retryOnFileLock(() => copyFile(original, backup));
		}

		await writeFileAtomically(original, `${JSON.stringify(data, null, "\t")}\n`);
	}

	return {
		read(file) {
			return enqueue(file, async () => {
				const { original, backup } = getFilePaths(file);
				const current = await readValidFile(file, original);
				if (current) return current;

				const recovered = (await readValidFile(file, backup)) ?? createDefaultData(file);
				// 원본을 옮기지 못했으면 덮어쓰지 않습니다. 복구본 저장에 실패해도 화면은 띄워야 하므로 무시합니다
				if (await moveAsideUnreadable(original)) {
					await writeFileSafely(file, recovered).catch(() => undefined);
				}
				return recovered;
			});
		},

		write(file, data) {
			return enqueue(file, async () => {
				const validation = validateForSave(file, data);
				if (!validation.isValid) {
					return { isSuccess: false, reason: "invalid", issues: validation.issues };
				}
				try {
					await writeFileSafely(file, validation.data);
					return { isSuccess: true, data: validation.data };
				} catch {
					return { isSuccess: false, reason: "io" };
				}
			});
		},

		async flush() {
			await Promise.all(queues.values());
		},
	};
}
