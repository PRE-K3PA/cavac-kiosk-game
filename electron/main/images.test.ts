import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createMockData } from "@/data/mock/mock-platform";
import { LIMITS } from "@/data/schema";
import type { ImageKind } from "@/types/data";
import { createDataStore } from "./data-store";
import { importImage, removeAllUnusedImages, removeUnusedImages, resolveImageUrl } from "./images";

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);
const IMAGE_FILE = "0f8fad5b-d9cb-469f-a165-70867728950e.png";

let rootDir: string;
let imagesDir: string;
let dataDir: string;
let sourceDir: string;

beforeEach(async () => {
	rootDir = await mkdtemp(path.join(tmpdir(), "cavac-images-"));
	imagesDir = path.join(rootDir, "images");
	dataDir = path.join(rootDir, "data");
	sourceDir = path.join(rootDir, "source");
	await mkdir(sourceDir);
});

afterEach(async () => {
	await rm(rootDir, { recursive: true, force: true });
});

async function writeSource(name: string, content: Buffer): Promise<string> {
	const filePath = path.join(sourceDir, name);
	await writeFile(filePath, content);
	return filePath;
}

async function writeImage(kind: ImageKind, fileName: string): Promise<void> {
	await mkdir(path.join(imagesDir, kind), { recursive: true });
	await writeFile(path.join(imagesDir, kind, fileName), PNG_HEADER);
}

async function listImages(kind: ImageKind): Promise<string[]> {
	return (await readdir(path.join(imagesDir, kind))).sort();
}

describe("이미지 등록", () => {
	test("PNG 는 images/<kind>/<uuid>.png 로 복사한다", async () => {
		const source = await writeSource("bottle.PNG", PNG_HEADER);
		const result = await importImage(imagesDir, "vaccine-bottle", source);

		expect(result.status).toBe("ok");
		if (result.status !== "ok") return;
		expect(result.path).toMatch(/^images\/vaccine-bottle\/[0-9a-f-]{36}\.png$/);
		expect(existsSync(path.join(rootDir, result.path))).toBe(true);
	});

	test("JPEG 확장자도 .jpg 로 저장한다", async () => {
		const source = await writeSource("logo.jpeg", JPG_HEADER);
		const result = await importImage(imagesDir, "vaccine-logo", source);
		expect(result.status).toBe("ok");
		if (result.status !== "ok") return;
		expect(result.path).toEndWith(".jpg");
		expect(existsSync(path.join(rootDir, result.path))).toBe(true);
	});

	test("PNG, JPG 가 아닌 확장자는 format 오류다", async () => {
		const source = await writeSource("image.gif", PNG_HEADER);
		expect(await importImage(imagesDir, "species", source)).toEqual({
			status: "error",
			reason: "format",
		});
	});

	test("확장자만 PNG 이고 내용이 다르면 format 오류다", async () => {
		const source = await writeSource("fake.png", JPG_HEADER);
		expect(await importImage(imagesDir, "species", source)).toEqual({
			status: "error",
			reason: "format",
		});
	});

	test("용량을 넘으면 size 오류다", async () => {
		const source = await writeSource("large.png", PNG_HEADER);
		await truncate(source, LIMITS.imageMaxBytes + 1);
		expect(await importImage(imagesDir, "product", source)).toEqual({
			status: "error",
			reason: "size",
		});
	});

	test("원본 파일을 읽지 못하면 io 오류다", async () => {
		const missing = path.join(sourceDir, "missing.png");
		expect(await importImage(imagesDir, "product", missing)).toEqual({
			status: "error",
			reason: "io",
		});
	});
});

describe("안 쓰는 이미지 정리", () => {
	const IMAGE_A = "11111111-1111-4111-8111-111111111111.png";
	const IMAGE_B = "22222222-2222-4222-8222-222222222222.png";
	const IMAGE_C = "33333333-3333-4333-8333-333333333333.png";

	function commonWithCharacter(fileName: string) {
		const common = createMockData("filled").common;
		common.species = [{ ...common.species[0], character: `images/species/${fileName}` }];
		common.homeAnimals = [];
		return common;
	}

	test("설정이 가리키지 않는 파일만 지우고 다른 설정의 폴더는 두지 않는다", async () => {
		await createDataStore(dataDir).write("common", commonWithCharacter(IMAGE_A));
		await writeImage("species", IMAGE_A);
		await writeImage("species", IMAGE_B);
		await writeImage("product", IMAGE_C);

		await removeUnusedImages(dataDir, imagesDir, "common");
		expect(await listImages("species")).toEqual([IMAGE_A]);
		expect(await listImages("product")).toEqual([IMAGE_C]);
	});

	test(".bak 이 가리키는 이전 이미지는 남겨서 .bak 으로 복구해도 이미지가 있다", async () => {
		const store = createDataStore(dataDir);
		await store.write("common", commonWithCharacter(IMAGE_A));
		await store.write("common", commonWithCharacter(IMAGE_B));
		await writeImage("species", IMAGE_A);
		await writeImage("species", IMAGE_B);
		await writeImage("species", IMAGE_C);

		await removeUnusedImages(dataDir, imagesDir, "common");
		expect(await listImages("species")).toEqual([IMAGE_A, IMAGE_B]);
	});

	test("깨진 원본이 가리키던 이미지는 복구한 뒤 앱을 여러 번 켜도 남는다", async () => {
		await mkdir(dataDir, { recursive: true });
		await writeFile(
			path.join(dataDir, "common.json"),
			`{ "species": [{ "character": "images/species/${IMAGE_A}" `,
		);
		await writeImage("species", IMAGE_A);
		await writeImage("species", IMAGE_B);

		await createDataStore(dataDir).read("common");
		await removeAllUnusedImages(dataDir, imagesDir);
		await removeAllUnusedImages(dataDir, imagesDir);
		expect(await listImages("species")).toEqual([IMAGE_A]);
	});
});

describe("cavac:// 주소", () => {
	test("images/<kind>/<uuid>.<ext> 를 images 안의 파일 경로로 바꾼다", () => {
		expect(resolveImageUrl(imagesDir, `cavac://images/species/${IMAGE_FILE}`)).toBe(
			path.join(imagesDir, "species", IMAGE_FILE),
		);
	});

	test.each([
		"cavac://images/../data/common.json",
		"cavac://images/%2e%2e/data/common.json",
		"cavac://images/species/..%2f..%2fdata%2fcommon.json",
		`cavac://images/species/..%5C..%5C${IMAGE_FILE}`,
		`cavac://images/species/C%3A%5C${IMAGE_FILE}`,
		`cavac://data/species/${IMAGE_FILE}`,
		`cavac://images/unknown-kind/${IMAGE_FILE}`,
		`cavac://images/species/${IMAGE_FILE}%3A%3A%24DATA`,
		`cavac://images/species/${IMAGE_FILE}.`,
		`cavac://images/species/${IMAGE_FILE}%20`,
		"cavac://images/species/",
		"cavac://images/species/CON",
		"cavac://images/species/not-a-uuid.png",
	])("images/<kind>/<uuid>.<ext> 모양이 아니면 undefined: %s", (url) => {
		expect(resolveImageUrl(imagesDir, url)).toBeUndefined();
	});
});
