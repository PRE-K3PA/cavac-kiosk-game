import { randomUUID } from "node:crypto";
import { access, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ImagePath, Species } from "@/types/data";
import type { DataStore } from "./data-store";
import { DEFAULT_SPECIES } from "./default-species";
import { importImage } from "./images";

type SeedOptions = {
	dataDir: string;
	imagesDir: string;
	/** 기본 축종 이미지가 든 폴더 */
	sourceDir: string;
	dataStore: DataStore;
	species?: readonly { file: string; name: string }[];
};

// common.json 유무로는 첫 실행을 알 수 없습니다. 화면이 한 번 읽기만 해도 data-store 가 기본값 파일을 만들기 때문입니다.
// 그래서 등록을 마쳤다는 표시를 따로 남깁니다
export const SEEDED_MARKER = "default-species-seeded";

async function exists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch (error) {
		// 없는 게 확실할 때만 false 입니다. 권한 문제 등으로 모르면 있다고 보고 등록하지 않습니다
		return !(error instanceof Error && "code" in error && error.code === "ENOENT");
	}
}

/**
 * 아직 등록한 적이 없고 축종이 하나도 없으면 기본 축종을 등록합니다.
 * 실패하면 표시를 남기지 않아 다음 실행에서 다시 시도합니다. 등록한 뒤 관리자가 모두 지운 경우는 다시 넣지 않습니다.
 */
export async function seedDefaultSpecies(options: SeedOptions): Promise<void> {
	const { dataDir, imagesDir, sourceDir, dataStore, species = DEFAULT_SPECIES } = options;
	const marker = path.join(dataDir, SEEDED_MARKER);
	if (await exists(marker)) return;

	async function markSeeded(): Promise<void> {
		await writeFile(marker, "").catch((error) =>
			console.error("기본 축종 표시를 남기지 못했습니다", error),
		);
	}

	const current = await dataStore.read("common");
	if (current.species.length > 0) {
		await markSeeded();
		return;
	}

	const copied: ImagePath[] = [];
	async function removeCopied(): Promise<void> {
		for (const imagePath of copied) {
			await unlink(path.join(imagesDir, ...imagePath.split("/").slice(1))).catch(() => undefined);
		}
	}

	const seeded: Species[] = [];
	for (const { file, name } of species) {
		const result = await importImage(imagesDir, "species", path.join(sourceDir, file));
		if (result.status !== "ok") {
			console.error(`기본 축종 이미지를 복사하지 못했습니다: ${file}`, result);
			await removeCopied();
			return;
		}
		copied.push(result.path);
		seeded.push({ id: randomUUID(), name, character: result.path });
	}

	// 축종이 없을 때 남은 메인 화면 동물은 가리킬 축종이 없어 저장 검사만 막으므로 비웁니다
	const saved = await dataStore.write("common", { ...current, species: seeded, homeAnimals: [] });
	if (!saved.isSuccess) {
		console.error("기본 축종을 저장하지 못했습니다", saved);
		await removeCopied();
		return;
	}
	await markSeeded();
}
