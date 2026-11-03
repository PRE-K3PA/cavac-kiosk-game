import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Checkbox from "@/components/admin/Checkbox";

afterEach(cleanup);

function getCheckbox() {
	return screen.getByRole<HTMLInputElement>("checkbox", { name: "사용" });
}

describe("Checkbox", () => {
	test("isChecked 를 체크 상태로 보여 준다", () => {
		const { rerender } = render(<Checkbox isChecked={false} aria-label="사용" />);
		expect(getCheckbox().checked).toBe(false);

		rerender(<Checkbox isChecked aria-label="사용" />);
		expect(getCheckbox().checked).toBe(true);
	});

	test("한 번 누를 때마다 바뀔 체크 상태로 onChange 를 한 번 부른다", () => {
		const onChange = mock(() => {});
		const { rerender } = render(
			<Checkbox isChecked={false} aria-label="사용" onChange={onChange} />,
		);

		fireEvent.click(getCheckbox());
		expect(onChange).toHaveBeenCalledTimes(1);
		expect(onChange).toHaveBeenLastCalledWith(true);

		rerender(<Checkbox isChecked aria-label="사용" onChange={onChange} />);
		fireEvent.click(getCheckbox());
		expect(onChange).toHaveBeenCalledTimes(2);
		expect(onChange).toHaveBeenLastCalledWith(false);
	});

	test("disabled 면 눌러도 onChange 를 부르지 않는다", () => {
		const onChange = mock(() => {});
		render(<Checkbox isChecked={false} aria-label="사용" disabled onChange={onChange} />);

		fireEvent.click(getCheckbox());

		expect(onChange).not.toHaveBeenCalled();
	});
});
