import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import PINChangeModal, { type PinChangeValue } from "@/components/admin/PINChangeModal";
import { LIMITS } from "@/data/schema";

afterEach(cleanup);

const EMPTY_VALUE: PinChangeValue = { current: "", next: "", confirm: "" };
const FIELD_LABELS = ["현재 PIN *", "새 PIN *", "새 PIN 확인 *"];

function getField(label: string) {
	return screen.getByLabelText<HTMLInputElement>(label);
}

function getButton(name: string) {
	return screen.getByRole<HTMLButtonElement>("button", { name });
}

describe("PINChangeModal", () => {
	test("PIN 길이만큼만 받는 비밀번호 칸 3개를 보여 준다", () => {
		const { container } = render(<PINChangeModal value={EMPTY_VALUE} />);

		expect(container.querySelectorAll("input")).toHaveLength(FIELD_LABELS.length);
		for (const label of FIELD_LABELS) {
			expect(getField(label).type).toBe("password");
			expect(getField(label).maxLength).toBe(LIMITS.pinLength);
		}
	});

	test("숫자가 아닌 글자는 모두 지우고 입력한 칸만 바꿔 넘긴다", () => {
		const onChange = mock(() => {});
		render(<PINChangeModal value={{ ...EMPTY_VALUE, current: "12" }} onChange={onChange} />);

		fireEvent.change(getField("새 PIN *"), { target: { value: "3a4b" } });

		expect(onChange).toHaveBeenCalledWith({ current: "12", next: "34", confirm: "" });
	});

	test("오류 문구를 보여 주고 그 칸만 오류로 표시한다", () => {
		render(
			<PINChangeModal
				value={EMPTY_VALUE}
				errorMessages={{ confirm: "새 PIN 이 서로 다릅니다." }}
			/>,
		);

		const message = screen.getByRole("status");
		expect(message.textContent).toBe("새 PIN 이 서로 다릅니다.");
		expect(getField("새 PIN 확인 *").getAttribute("aria-describedby")).toBe(message.id);
		expect(getField("새 PIN 확인 *").getAttribute("aria-invalid")).toBe("true");
		for (const label of ["현재 PIN *", "새 PIN *"]) {
			expect(getField(label).getAttribute("aria-describedby")).toBeNull();
			expect(getField(label).getAttribute("aria-invalid")).toBe("false");
		}
	});

	test("disabled 면 칸과 취소·저장 버튼이 모두 막힌다", () => {
		render(<PINChangeModal value={EMPTY_VALUE} disabled />);

		for (const label of FIELD_LABELS) {
			expect(getField(label).disabled).toBe(true);
		}
		expect(getButton("취소").disabled).toBe(true);
		expect(getButton("저장").disabled).toBe(true);
	});

	test("isSaveDisabled 면 저장 버튼만 막힌다", () => {
		render(<PINChangeModal value={EMPTY_VALUE} isSaveDisabled />);

		for (const label of FIELD_LABELS) {
			expect(getField(label).disabled).toBe(false);
		}
		expect(getButton("취소").disabled).toBe(false);
		expect(getButton("저장").disabled).toBe(true);
	});

	test("취소와 저장은 각자 자기 콜백만 부른다", () => {
		const onCancelClick = mock(() => {});
		const onSaveClick = mock(() => {});
		render(
			<PINChangeModal
				value={EMPTY_VALUE}
				onCancelClick={onCancelClick}
				onSaveClick={onSaveClick}
			/>,
		);

		fireEvent.click(getButton("취소"));
		expect(onCancelClick).toHaveBeenCalledTimes(1);
		expect(onSaveClick).not.toHaveBeenCalled();

		fireEvent.click(getButton("저장"));
		expect(onSaveClick).toHaveBeenCalledTimes(1);
		expect(onCancelClick).toHaveBeenCalledTimes(1);
	});
});
