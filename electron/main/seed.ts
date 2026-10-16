import { randomUUID } from "node:crypto";
import { access, unlink } from "node:fs/promises";
import path from "node:path";
import { createDefaultData } from "@/data/defaults";
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

async function exists(filePath: string): Promise<boolean> {
	try {
		await access(filePath);
		return true;
	} catch (error) {
		// 없는 게 확실할 때만 false 입니다. 권한 문제 등으로 모르면 있다고 보고 덮어쓰지 않습니다
		return !(error instanceof Error && "code" in error && error.code === "ENOENT");
	}
}

/**
 * common.json 과 .bak 이 모두 없을 때(첫 실행) 기본 축종을 등록합니다.
 * 이미지를 하나라도 복사하지 못하면 아무것도 저장하지 않아 다음 실행에서 다시 시도합니다.
 */
export async function seedDefaultSpecies(options: SeedOptions): Promise<void> {
	const { dataDir, imagesDir, sourceDir, dataStore, species = DEFAULT_SPECIES } = options;
	const original = path.join(dataDir, "common.json");
	if ((await exists(original)) || (await exists(`${original}.bak`))) return;

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

	const saved = await dataStore.write("common", {
		...createDefaultData("common"),
		species: seeded,
	});
	if (!saved.isSuccess) {
		console.error("기본 축종을 저장하지 못했습니다", saved);
		await removeCopied();
	}
}
