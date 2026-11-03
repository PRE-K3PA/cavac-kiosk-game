import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PenaltyRow from "@/components/admin/PenaltyRow";

afterEach(cleanup);

const ROW = { label: "시간 차감", unit: "초" };

function getCheckbox() {
	return screen.getByRole<HTMLInputElement>("checkbox", { name: ROW.label });
}

function getValueInput() {
	return screen.getByRole<HTMLInputElement>("textbox", { name: ROW.label });
}

describe("PenaltyRow", () => {
	test("라벨을 누르면 체크 상태를 한 번 바꾼다", () => {
		const onCheckedChange = mock(() => {});
		render(<PenaltyRow {...ROW} isChecked={false} value={3} onCheckedChange={onCheckedChange} />);

		fireEvent.click(screen.getByText(ROW.label));

		expect(onCheckedChange).toHaveBeenCalledTimes(1);
		expect(onCheckedChange).toHaveBeenCalledWith(true);
	});

	test("숫자가 아닌 글자는 모두 빼고 숫자로 넘긴다", () => {
		const onValueChange = mock(() => {});
		render(<PenaltyRow {...ROW} isChecked value={3} onValueChange={onValueChange} />);

		fireEvent.change(getValueInput(), { target: { value: "1a2b3" } });

		expect(onValueChange).toHaveBeenCalledWith(123);
	});

	test("숫자 칸을 비우면 null 을 넘긴다", () => {
		const onValueChange = mock(() => {});
		render(<PenaltyRow {...ROW} isChecked value={3} onValueChange={onValueChange} />);

		fireEvent.change(getValueInput(), { target: { value: "" } });

		expect(onValueChange).toHaveBeenCalledWith(null);
	});

	test("값이 없으면 빈칸으로, 0 이면 0 으로 보여 준다", () => {
		const { rerender } = render(<PenaltyRow {...ROW} isChecked value={null} />);
		expect(getValueInput().value).toBe("");

		rerender(<PenaltyRow {...ROW} isChecked value={0} />);
		expect(getValueInput().value).toBe("0");
	});

	test("꺼져 있으면 숫자 칸이 막힌다", () => {
		const { rerender } = render(<PenaltyRow {...ROW} isChecked={false} value={3} />);
		expect(getCheckbox().checked).toBe(false);
		expect(getValueInput().disabled).toBe(true);

		rerender(<PenaltyRow {...ROW} isChecked value={3} />);
		expect(getValueInput().disabled).toBe(false);
	});

	test("켜져 있고 오류일 때만 aria-invalid 가 true 다", () => {
		const { rerender } = render(<PenaltyRow {...ROW} isChecked={false} value={null} isError />);
		expect(getValueInput().getAttribute("aria-invalid")).toBe("false");

		rerender(<PenaltyRow {...ROW} isChecked value={3} />);
		expect(getValueInput().getAttribute("aria-invalid")).toBe("false");

		rerender(<PenaltyRow {...ROW} isChecked value={null} isError />);
		expect(getValueInput().getAttribute("aria-invalid")).toBe("true");
	});
});
