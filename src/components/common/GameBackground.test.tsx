import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import GameBackground from "@/components/common/GameBackground";

afterEach(cleanup);

describe("GameBackground", () => {
	test("장식용 배경 이미지와 흰색 오버레이를 그린다", () => {
		const { container } = render(<GameBackground />);
		const image = container.querySelector("img");

		expect(image?.getAttribute("alt")).toBe("");
		expect(image?.getAttribute("src")).toContain("imgGameBackground");
		expect(container.querySelector("div")?.className).toContain("bg-background-surface/35");
	});
});
