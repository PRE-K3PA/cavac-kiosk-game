import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createDefaultData } from "@/data/defaults";
import { dataSchemas } from "@/data/schema";
import { createDataStore } from "./data-store";
import { DEFAULT_SPECIES } from "./default-species";
import { SEEDED_MARKER, seedDefaultSpecies } from "./seed";

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

function writeCommon(data: unknown) {
	return createDataStore(dataDir).write("common", data);
}

function hasMarker(): boolean {
	return existsSync(path.join(dataDir, SEEDED_MARKER));
}

const MISSING_SPECIES = [...DEFAULT_SPECIES, { file: "missing.png", name: "없음" }];

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
		expect(hasMarker()).toBe(true);
	});

	test("등록한 뒤 다시 실행해도 중복으로 넣지 않는다", async () => {
		await seed();
		await seed();

		expect(await listSpeciesImages()).toHaveLength(DEFAULT_SPECIES.length);
	});

	test("실패한 뒤 화면이 기본값 파일을 만들어도 다음 실행에서 다시 등록한다", async () => {
		await seed({ species: MISSING_SPECIES });
		await createDataStore(dataDir).read("common");
		expect(existsSync(path.join(dataDir, "common.json"))).toBe(true);

		await seed();

		const parsed = dataSchemas.common.safeParse(await readCommon());
		expect(parsed.success && parsed.data.species).toHaveLength(DEFAULT_SPECIES.length);
		expect(hasMarker()).toBe(true);
	});

	test("축종이 없는 기존 설정에는 다른 설정을 그대로 두고 축종만 넣는다", async () => {
		await writeCommon({ ...createDefaultData("common"), playDurationSeconds: 30 });

		await seed();

		const parsed = dataSchemas.common.safeParse(await readCommon());
		expect(parsed.success && parsed.data.playDurationSeconds).toBe(30);
		expect(parsed.success && parsed.data.species).toHaveLength(DEFAULT_SPECIES.length);
	});

	test("축종 없이 메인 화면 동물만 남은 설정이어도 등록하고 그 칸은 비운다", async () => {
		await mkdir(dataDir, { recursive: true });
		const broken = {
			...createDefaultData("common"),
			homeAnimals: [{ speciesId: "0f8fad5b-d9cb-469f-a165-70867728950e", slot: "left-1" }],
		};
		await writeFile(path.join(dataDir, "common.json"), JSON.stringify(broken));

		await seed();

		const parsed = dataSchemas.common.safeParse(await readCommon());
		expect(parsed.success && parsed.data.species).toHaveLength(DEFAULT_SPECIES.length);
		expect(parsed.success && parsed.data.homeAnimals).toEqual([]);
		expect(hasMarker()).toBe(true);
	});

	test("이미 축종이 있으면 건드리지 않고 등록한 것으로 표시한다", async () => {
		await seed({ species: DEFAULT_SPECIES.slice(0, 1) });
		await rm(path.join(dataDir, SEEDED_MARKER));
		const before = await readCommon();

		await seed();

		expect(await readCommon()).toEqual(before);
		expect(await listSpeciesImages()).toHaveLength(1);
		expect(hasMarker()).toBe(true);
	});

	test("등록한 뒤 관리자가 축종을 모두 지웠으면 다시 넣지 않는다", async () => {
		await seed();
		await writeCommon(createDefaultData("common"));

		await seed();

		const parsed = dataSchemas.common.safeParse(await readCommon());
		expect(parsed.success && parsed.data.species).toEqual([]);
	});

	test("이미지를 하나라도 복사하지 못하면 축종을 넣지 않고 복사한 이미지도 지운다", async () => {
		await seed({ species: MISSING_SPECIES });

		const parsed = dataSchemas.common.safeParse(await readCommon());
		expect(parsed.success && parsed.data.species).toEqual([]);
		expect(await listSpeciesImages()).toEqual([]);
		expect(hasMarker()).toBe(false);
	});

	test("저장 검사를 통과하지 못하면 복사한 이미지를 지우고 표시를 남기지 않는다", async () => {
		const first = DEFAULT_SPECIES.slice(0, 1);
		await seed({ species: [...first, ...first] });

		expect(await listSpeciesImages()).toEqual([]);
		expect(hasMarker()).toBe(false);
	});
});
