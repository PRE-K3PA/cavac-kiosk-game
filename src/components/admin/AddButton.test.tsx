import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AddButton from "@/components/admin/AddButton";

afterEach(cleanup);

function getButton() {
	return screen.getByRole<HTMLButtonElement>("button", { name: "+ 새 백신 추가" });
}

describe("AddButton", () => {
	test("라벨 앞에 + 를 붙이고 누르면 onClick 을 부른다", () => {
		const onClick = mock(() => {});
		render(<AddButton label="새 백신 추가" onClick={onClick} />);

		fireEvent.click(getButton());

		expect(onClick).toHaveBeenCalledTimes(1);
	});

	test("disabled 면 눌러도 onClick 을 부르지 않는다", () => {
		const onClick = mock(() => {});
		render(<AddButton label="새 백신 추가" disabled onClick={onClick} />);

		fireEvent.click(getButton());

		expect(onClick).not.toHaveBeenCalled();
	});
});
