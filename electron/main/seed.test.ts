import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDefaultData } from "@/data/defaults";
import { dataSchemas } from "@/data/schema";
import { createDataStore } from "./data-store";
import { DEFAULT_SPECIES } from "./default-species";
import { seedDefaultSpecies } from "./seed";

const BUNDLED_DIR = path.join(import.meta.dirname, "..", "..", "resources", "default-species");

let rootDir: string;
let dataDir: string;
let imagesDir: string;

beforeEach(async () => {
	rootDir = await mkdtemp(path.join(tmpdir(), "cavac-seed-"));
	dataDir = path.join(rootDir, "data");
	imagesDir = path.join(rootDir, "images");
});

afterEach(async () => {
	await rm(rootDir, { recursive: true, force: true });
});

function seed(options: { sourceDir?: string; species?: typeof DEFAULT_SPECIES } = {}) {
	return seedDefaultSpecies({
		dataDir,
		imagesDir,
		sourceDir: options.sourceDir ?? BUNDLED_DIR,
		dataStore: createDataStore(dataDir),
		species: options.species,
	});
}

async function readCommon(): Promise<unknown> {
	return JSON.parse(await readFile(path.join(dataDir, "common.json"), "utf8"));
}

function listSpeciesImages(): Promise<string[]> {
	return readdir(path.join(imagesDir, "species")).catch(() => []);
}

describe("기본 축종 등록", () => {
	test("첫 실행에는 앱에 포함된 축종을 순서대로 등록하고 이미지를 복사한다", async () => {
		await seed();

		const parsed = dataSchemas.common.safeParse(await readCommon());
		expect(parsed.success).toBe(true);
		if (!parsed.success) return;

		const { species, ...rest } = parsed.data;
		const { species: _, ...defaults } = createDefaultData("common");
		expect(rest).toEqual(defaults);
		expect(species.map((item) => item.name)).toEqual(DEFAULT_SPECIES.map((item) => item.name));
		for (const item of species) {
			expect(existsSync(path.join(imagesDir, ...item.character.split("/").slice(1)))).toBe(true);
		}
		expect(await listSpeciesImages()).toHaveLength(DEFAULT_SPECIES.length);
	});

	test("common.json 이 이미 있으면 건드리지 않는다", async () => {
		await mkdir(dataDir, { recursive: true });
		const existing = `${JSON.stringify(createDefaultData("common"))}\n`;
		await writeFile(path.join(dataDir, "common.json"), existing);

		await seed();

		expect(await readFile(path.join(dataDir, "common.json"), "utf8")).toBe(existing);
		expect(await listSpeciesImages()).toEqual([]);
	});

	test("백업만 남아 있으면 첫 실행이 아니므로 등록하지 않는다", async () => {
		await mkdir(dataDir, { recursive: true });
		await writeFile(
			path.join(dataDir, "common.json.bak"),
			JSON.stringify(createDefaultData("common")),
		);

		await seed();

		expect(existsSync(path.join(dataDir, "common.json"))).toBe(false);
		expect(await listSpeciesImages()).toEqual([]);
	});

	test("이미지를 하나라도 복사하지 못하면 저장하지 않고 복사한 이미지도 지운다", async () => {
		await seed({ species: [...DEFAULT_SPECIES, { file: "missing.png", name: "없음" }] });

		expect(existsSync(path.join(dataDir, "common.json"))).toBe(false);
		expect(await listSpeciesImages()).toEqual([]);
	});

	test("저장 검사를 통과하지 못하면 복사한 이미지를 지운다", async () => {
		const first = DEFAULT_SPECIES.slice(0, 1);
		await seed({ species: [...first, ...first] });

		expect(existsSync(path.join(dataDir, "common.json"))).toBe(false);
		expect(await listSpeciesImages()).toEqual([]);
	});
});
