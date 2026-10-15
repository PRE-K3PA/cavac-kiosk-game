import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readdir, rm, truncate, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createMockData } from "@/data/mock/mock-platform";
import { LIMITS } from "@/data/schema";
import type { ImageKind } from "@/types/data";
import { createDataStore } from "./data-store";
import {
	importImage,
	removeUnusedImages,
	removeUnusedImagesOnStartup,
	resolveImageUrl,
} from "./images";

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00]);
const JPG_HEADER = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00]);

let rootDir: string;
let imagesDir: string;
let sourceDir: string;

beforeEach(async () => {
	rootDir = await mkdtemp(path.join(tmpdir(), "cavac-images-"));
	imagesDir = path.join(rootDir, "images");
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
		expect(result.status === "ok" && result.path.endsWith(".jpg")).toBe(true);
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
	test("지정한 폴더에서 쓰지 않는 파일만 지우고 다른 폴더는 두지 않는다", async () => {
		await writeImage("vaccine-bottle", "used.png");
		await writeImage("vaccine-bottle", "unused.png");
		await writeImage("product", "unsaved.png");

		await removeUnusedImages(imagesDir, ["vaccine-bottle"], ["images/vaccine-bottle/used.png"]);
		expect(await listImages("vaccine-bottle")).toEqual(["used.png"]);
		expect(await listImages("product")).toEqual(["unsaved.png"]);
	});

	test("앱 시작 때 설정에서 쓰는 이미지는 남기고 나머지는 지운다", async () => {
		const dataDir = path.join(rootDir, "data");
		const store = createDataStore(dataDir);
		const common = createMockData("filled").common;
		await store.write("common", common);
		const [first] = common.species;
		await writeImage("species", path.basename(first.character));
		await writeImage("species", "unused.png");

		await removeUnusedImagesOnStartup(imagesDir, store);
		expect(await listImages("species")).toEqual([path.basename(first.character)]);
	});

	test("원본을 읽지 못해 복구한 설정의 폴더는 정리하지 않는다", async () => {
		const dataDir = path.join(rootDir, "data");
		await mkdir(dataDir);
		await writeFile(path.join(dataDir, "common.json"), "{ 깨진 파일");
		await writeImage("species", "maybe-used.png");

		await removeUnusedImagesOnStartup(imagesDir, createDataStore(dataDir));
		expect(await listImages("species")).toEqual(["maybe-used.png"]);
	});
});

describe("cavac:// 주소", () => {
	test("images 안의 파일 경로로 바꾼다", () => {
		expect(resolveImageUrl(imagesDir, "cavac://images/species/a.png")).toBe(
			path.join(imagesDir, "species", "a.png"),
		);
	});

	test.each([
		"cavac://images/../data/common.json",
		"cavac://images/%2e%2e/data/common.json",
		"cavac://images/species/..%2f..%2fdata%2fcommon.json",
		"cavac://data/common.json",
		"cavac://images/",
		"cavac://images/unknown-kind/a.png",
		"cavac://images/species/.hidden",
	])("images/<kind>/<파일> 모양이 아니면 undefined: %s", (url) => {
		expect(resolveImageUrl(imagesDir, url)).toBeUndefined();
	});
});
