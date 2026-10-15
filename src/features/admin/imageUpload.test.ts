import { describe, expect, test } from "bun:test";
import { LIMITS } from "@/data/schema";
import { IMAGE_ERROR_MESSAGES } from "@/features/admin/imageUpload";

describe("IMAGE_ERROR_MESSAGES", () => {
	test("용량 오류는 LIMITS.imageMaxBytes 를 MB 로 보여 준다", () => {
		expect(IMAGE_ERROR_MESSAGES.size).toContain(`${LIMITS.imageMaxBytes / 1024 / 1024}MB`);
	});
});
