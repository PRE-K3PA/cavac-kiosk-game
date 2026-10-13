import { describe, expect, test } from "bun:test";
import { createDefaultData } from "@/data/defaults";
import { createMockData, createMockPlatform } from "@/data/mock/mock-platform";
import { antigenKey, formatAntigenLabel, isHintDelayTooLong, validateForSave } from "@/data/rules";
import { dataSchemas } from "@/data/schema";
import { ANTIGEN_COLOR_KEYS, DATA_FILES } from "@/types/data";

describe("목데이터", () => {
	const filled = createMockData("filled");

	test.each([...DATA_FILES])("filled %s 는 모양 검사와 저장 규칙을 통과한다", (file) => {
		expect(dataSchemas[file].safeParse(filled[file]).success).toBe(true);
		expect(validateForSave(file, filled[file])).toMatchObject({ isValid: true });
	});

	test("같은 항원(ND)이 여러 백신에 있고, 약어가 같아도 세부 타입이 다르면 다른 항원이다", () => {
		const keys = filled["vaccine-game"].vaccines.flatMap((vaccine) =>
			vaccine.antigens.map(antigenKey),
		);
		expect(keys).toContain("ND::");
		expect(keys).toContain("ND::VII");
		expect(keys).toContain("AI::Y280");
		expect(keys).toContain("AI::H9");
	});

	test("세균 항원과 바이러스 항원이 모두 있다", () => {
		const types = filled["vaccine-game"].vaccines.flatMap((vaccine) =>
			vaccine.antigens.map((antigen) => antigen.pathogenType),
		);
		expect(new Set(types)).toEqual(new Set(["bacteria", "virus"]));
	});

	test("세부 타입은 '형' 없이 저장한다", () => {
		const subtypes = filled["vaccine-game"].vaccines.flatMap((vaccine) =>
			vaccine.antigens.map((antigen) => antigen.subtype ?? ""),
		);
		expect(subtypes.some((subtype) => subtype.endsWith("형"))).toBe(false);
	});
});

describe("항원 표시", () => {
	test("세부 타입이 있으면 약어 뒤에 붙이고, 없으면 약어만 보여 준다", () => {
		expect(formatAntigenLabel({ abbr: "AI", subtype: "Y280" })).toBe("AI Y280");
		expect(formatAntigenLabel({ abbr: "ND", subtype: null })).toBe("ND");
	});

	test("색 키는 01~25 의 25개다", () => {
		expect(ANTIGEN_COLOR_KEYS).toHaveLength(25);
		expect(ANTIGEN_COLOR_KEYS[0]).toBe("01");
		expect(ANTIGEN_COLOR_KEYS[24]).toBe("25");
	});
});

describe("기본값 (첫 실행)", () => {
	test("empty 목데이터는 축종만 있고 메인 화면 동물, 백신, 켜진 제품이 없다", () => {
		const empty = createMockData("empty");
		expect(empty.common.species.length).toBeGreaterThan(0);
		expect(empty.common.homeAnimals).toHaveLength(0);
		expect(empty["vaccine-game"].vaccines).toHaveLength(0);
		expect(empty["card-game"].products.some((product) => product.isEnabled)).toBe(false);
		expect(validateForSave("common", empty.common).isValid).toBe(true);
	});

	test.each([...DATA_FILES])("%s 기본값은 모양 검사를 통과한다", (file) => {
		expect(dataSchemas[file].safeParse(createDefaultData(file)).success).toBe(true);
	});

	test("백신 0개, 제품 0개 켜짐 상태는 저장할 수 없다", () => {
		expect(validateForSave("vaccine-game", createDefaultData("vaccine-game")).isValid).toBe(false);
		expect(validateForSave("card-game", createDefaultData("card-game")).isValid).toBe(false);
	});
});

describe("저장 규칙", () => {
	test("앞뒤 공백을 지우고 공백만 있는 세부 타입은 null 로 저장한다", () => {
		const data = createMockData("filled")["vaccine-game"];
		data.vaccines[0].antigens[1] = { ...data.vaccines[0].antigens[1], abbr: " ND ", subtype: "  " };
		const result = validateForSave("vaccine-game", data);
		if (!result.isValid) throw new Error(result.issues.join("\n"));
		expect(result.data.vaccines[0].antigens[1]).toMatchObject({ abbr: "ND", subtype: null });
	});

	test("같은 백신 안에 약어와 세부 타입이 같은 항원이 있으면 막는다", () => {
		const data = createMockData("filled")["vaccine-game"];
		const [first] = data.vaccines[1].antigens;
		data.vaccines[1].antigens.push({ ...first, id: crypto.randomUUID() });
		expect(validateForSave("vaccine-game", data).isValid).toBe(false);
	});

	test("병원체 종류가 세균, 바이러스가 아니면 모양 검사에서 막는다", () => {
		const data = createMockData("filled")["vaccine-game"];
		const antigen = data.vaccines[0].antigens[0];
		data.vaccines[0].antigens[0] = { ...antigen, pathogenType: "parasite" as never };
		expect(dataSchemas["vaccine-game"].safeParse(data).success).toBe(false);
	});

	test("약어가 같은데 백신마다 세균, 바이러스 구분이 다르면 막는다", () => {
		const data = createMockData("filled")["vaccine-game"];
		const ndAntigens = data.vaccines
			.flatMap((vaccine) => vaccine.antigens)
			.filter((antigen) => antigen.abbr === "ND");
		expect(ndAntigens.length).toBeGreaterThan(1);
		ndAntigens[0].pathogenType = "bacteria";
		const result = validateForSave("vaccine-game", data);
		expect(result.isValid).toBe(false);
		if (!result.isValid) expect(result.issues.some((issue) => issue.startsWith("ND:"))).toBe(true);
	});

	test("모든 항원이 고정이면 막는다", () => {
		const data = createMockData("filled")["vaccine-game"];
		for (const antigen of data.vaccines[1].antigens) antigen.isPinned = true;
		expect(validateForSave("vaccine-game", data).isValid).toBe(false);
	});

	test("켜진 제품 수가 쌍 수와 다르면 막는다", () => {
		const data = createMockData("filled")["card-game"];
		data.settings.pairCount = 4;
		expect(validateForSave("card-game", data).isValid).toBe(false);
	});

	test("축종명 중복과 6자 초과를 막는다", () => {
		const data = createMockData("filled").common;
		data.species[1].name = data.species[0].name;
		data.species[2].name = "일곱글자축종명";
		const result = validateForSave("common", data);
		expect(result.isValid).toBe(false);
		if (!result.isValid) expect(result.issues).toHaveLength(2);
	});

	test("제한 시간은 5초 단위만 통과한다", () => {
		const data = createMockData("filled").common;
		data.playDurationSeconds = 42;
		expect(validateForSave("common", data).isValid).toBe(false);
	});

	test("힌트 시간이 제한 시간 이상이면 경고한다", () => {
		const data = createMockData("filled")["vaccine-game"];
		data.settings.hint.delaySeconds = 30;
		expect(isHintDelayTooLong(data, 30)).toBe(true);
		expect(isHintDelayTooLong(data, 60)).toBe(false);
	});
});

describe("mock Platform", () => {
	test("저장하면 정리된 값을 돌려주고 다시 읽을 때 반영된다", async () => {
		const platform = createMockPlatform();
		const common = await platform.getData("common");
		common.playDurationSeconds = 30;
		common.species[0].name = " 양 ";

		const result = await platform.updateData("common", common);
		expect(result).toMatchObject({ isSuccess: true });
		const reloaded = await platform.getData("common");
		expect(reloaded.playDurationSeconds).toBe(30);
		expect(reloaded.species[0].name).toBe("양");
	});

	test("규칙에 걸리면 저장하지 않고 사유를 돌려준다", async () => {
		const platform = createMockPlatform({ scenario: "empty" });
		const result = await platform.updateData(
			"vaccine-game",
			await platform.getData("vaccine-game"),
		);
		expect(result).toMatchObject({ isSuccess: false, reason: "invalid" });
	});

	test("shouldFailSave 면 io 실패를 돌려준다", async () => {
		const platform = createMockPlatform({ shouldFailSave: true });
		const result = await platform.updateData("card-game", await platform.getData("card-game"));
		expect(result).toEqual({ isSuccess: false, reason: "io" });
	});

	test("PIN 은 0000 과 마스터 PIN 으로 확인하고 바꿀 수 있다", async () => {
		const platform = createMockPlatform();
		expect(await platform.verifyPin("0000")).toBe(true);
		expect(await platform.updatePin("1111", "2222")).toEqual({
			isSuccess: false,
			reason: "wrong-current",
		});
		expect(await platform.updatePin("0000", "2222")).toEqual({ isSuccess: true });
		expect(await platform.verifyPin("2222")).toBe(true);
		expect(await platform.verifyPin("9999")).toBe(true);
	});

	test("목 이미지 경로는 오프라인 SVG 로 바뀐다", async () => {
		const platform = createMockPlatform();
		const { species } = await platform.getData("common");
		expect(platform.getImageUrl(species[0].character)).toStartWith("data:image/svg+xml");
	});
});
