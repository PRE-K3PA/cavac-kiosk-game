import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TextInput from "@/components/admin/TextInput";

afterEach(cleanup);

function getInput() {
	return screen.getByRole<HTMLInputElement>("textbox", { name: "백신 검색" });
}

describe("TextInput", () => {
	test("입력하면 바뀐 글자를 onChange 로 넘긴다", () => {
		const onChange = mock(() => {});
		render(<TextInput value="" aria-label="백신 검색" onChange={onChange} />);

		fireEvent.change(getInput(), { target: { value: "돼지" } });

		expect(onChange).toHaveBeenCalledWith("돼지");
	});

	test("isError 일 때만 aria-invalid 가 true 다", () => {
		const { rerender } = render(<TextInput value="" aria-label="백신 검색" />);
		expect(getInput().getAttribute("aria-invalid")).toBe("false");

		rerender(<TextInput value="" aria-label="백신 검색" isError />);
		expect(getInput().getAttribute("aria-invalid")).toBe("true");
	});

	test("disabled 면 입력 칸이 막힌다", () => {
		render(<TextInput value="" aria-label="백신 검색" disabled />);

		expect(getInput().disabled).toBe(true);
	});
});
