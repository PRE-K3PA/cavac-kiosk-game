import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AnimalSlot from "@/components/common/AnimalSlot";

afterEach(cleanup);

describe("AnimalSlot", () => {
	test("이미지가 있으면 alt 와 함께 그린다", () => {
		render(<AnimalSlot src="file://images/species/chicken.png" name="닭" />);
		expect(screen.getByAltText("닭")).toBeTruthy();
	});

	test("이미지를 불러오지 못하면 이미지와 그림자를 그리지 않는다", () => {
		const { container } = render(<AnimalSlot src="file://images/species/none.png" name="닭" />);

		fireEvent.error(screen.getByAltText("닭"));

		expect(screen.queryByAltText("닭")).toBeNull();
		expect(container.querySelector("[aria-hidden]")).toBeNull();
	});

	test("다른 이미지로 바뀌면 다시 그린다", () => {
		const { rerender } = render(<AnimalSlot src="file://images/species/none.png" name="닭" />);
		fireEvent.error(screen.getByAltText("닭"));

		rerender(<AnimalSlot src="file://images/species/chicken.png" name="닭" />);

		expect(screen.getByAltText("닭")).toBeTruthy();
	});
});
