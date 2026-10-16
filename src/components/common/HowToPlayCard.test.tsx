import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import HowToPlayCard from "@/components/common/HowToPlayCard";

afterEach(cleanup);

describe("HowToPlayCard", () => {
	test.each(["blue", "yellow", "green"] as const)(
		"%s 강조색에서도 단계 번호와 설명이 보인다",
		(accent) => {
			render(<HowToPlayCard step="2" description="같은 카드끼리 짝지어요." accent={accent} />);
			expect(screen.getByText("2")).toBeTruthy();
			expect(screen.getByText("같은 카드끼리 짝지어요.")).toBeTruthy();
		},
	);

	test.each(["column", "row"] as const)("%s 배치에서도 팁 문구를 보여준다", (direction) => {
		render(<HowToPlayCard step="3" description="설명" direction={direction} tip="신중하게!" />);
		expect(screen.getByText("신중하게!")).toBeTruthy();
	});
});
