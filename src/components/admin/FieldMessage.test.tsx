import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import FieldMessage from "@/components/admin/FieldMessage";

afterEach(cleanup);

const MESSAGE = "새 PIN 이 서로 다릅니다.";

describe("FieldMessage", () => {
	test("문구를 status 역할로 보여 준다", () => {
		render(<FieldMessage message={MESSAGE} />);

		expect(screen.getByRole("status").textContent).toBe(MESSAGE);
	});

	test("id 를 aria-describedby 로 가리킨 입력 칸의 설명 문구가 된다", () => {
		render(
			<>
				<input aria-label="새 PIN 확인" aria-describedby="pin-message" />
				<FieldMessage id="pin-message" message={MESSAGE} />
			</>,
		);

		expect(screen.getByRole("textbox", { name: "새 PIN 확인", description: MESSAGE })).toBeTruthy();
	});
});
