import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import MemoryCard from "@/components/card/MemoryCard";

afterEach(cleanup);

function frontFace(container: HTMLElement): Element {
	const face = container.querySelector(".backface-hidden.rotate-y-180");
	if (!face) throw new Error("앞면을 찾지 못했습니다");
	return face;
}

describe("MemoryCard 뒷면 로고", () => {
	const logoSrc = (container: HTMLElement) =>
		container.querySelector("img.opacity-50")?.getAttribute("src");

	test("logo 를 주지 않으면 기본 로고를 쓴다", () => {
		const { container } = render(<MemoryCard label="카드 1" />);

		expect(logoSrc(container)).toContain("imgMemoryLogo");
	});

	test("logo 를 주면 그 이미지를 쓴다", () => {
		const { container } = render(<MemoryCard label="카드 1" logo="file://logo-en.png" />);

		expect(logoSrc(container)).toBe("file://logo-en.png");
	});
});

describe("MemoryCard 앞면 모양", () => {
	test("오답이 뒷면으로 돌아가는 동안에는 직전 앞면 모양을 유지한다", () => {
		const { container, rerender } = render(<MemoryCard label="카드 1" state="wrong" />);
		expect(frontFace(container).className).toContain("border-state-error");

		rerender(<MemoryCard label="카드 1" state="back" />);

		expect(frontFace(container).className).toContain("border-state-error");
	});

	test("다시 앞면이 되면 새 상태의 모양으로 바뀐다", () => {
		const { container, rerender } = render(<MemoryCard label="카드 1" state="wrong" />);
		rerender(<MemoryCard label="카드 1" state="back" />);
		rerender(<MemoryCard label="카드 1" state="front" />);

		expect(frontFace(container).className).toContain("border-border-default");
		expect(frontFace(container).className).not.toContain("border-state-error");

		rerender(<MemoryCard label="카드 1" state="matched" />);
		expect(frontFace(container).className).toContain("border-state-success");
	});

	test("처음부터 뒷면이면 앞면은 기본 모양이다", () => {
		const { container } = render(<MemoryCard label="카드 1" />);

		expect(frontFace(container).className).toContain("border-border-default");
	});
});
