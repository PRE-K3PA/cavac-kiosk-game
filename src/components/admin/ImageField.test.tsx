import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ImageField from "@/components/admin/ImageField";

afterEach(cleanup);

const IMAGE_SRC = "file://images/product/00000000-0000-4000-8000-000000000100.png";

describe("ImageField", () => {
	test("사진이 없으면 이미지 없음을 보여 주고 미리보기 버튼은 없다", () => {
		render(<ImageField />);

		expect(screen.getByText("이미지 없음")).toBeTruthy();
		expect(screen.queryByRole("button", { name: "미리보기" })).toBeNull();
	});

	test("사진이 있으면 그 사진을 그리고 미리보기를 누르면 onPreviewClick 을 부른다", () => {
		const onPreviewClick = mock(() => {});
		const { container } = render(
			<ImageField imageSrc={IMAGE_SRC} onPreviewClick={onPreviewClick} />,
		);

		fireEvent.click(screen.getByRole("button", { name: "미리보기" }));

		expect(container.querySelector("img")?.getAttribute("src")).toBe(IMAGE_SRC);
		expect(onPreviewClick).toHaveBeenCalledTimes(1);
	});

	test("파일 선택을 누르면 onSelectClick 을 부른다", () => {
		const onSelectClick = mock(() => {});
		render(<ImageField onSelectClick={onSelectClick} />);

		fireEvent.click(screen.getByRole("button", { name: "파일 선택" }));

		expect(onSelectClick).toHaveBeenCalledTimes(1);
	});

	test("오류 문구가 있으면 PNG / JPG 안내 대신 보여 준다", () => {
		const { rerender } = render(<ImageField />);
		expect(screen.getByText("PNG / JPG")).toBeTruthy();

		rerender(<ImageField errorMessage="이미지를 불러오지 못했습니다." />);
		expect(screen.getByText("이미지를 불러오지 못했습니다.")).toBeTruthy();
		expect(screen.queryByText("PNG / JPG")).toBeNull();
	});
});
