import { afterEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";

afterEach(cleanup);

const TARGET = "돼지 써코바이러스 백신";
const WARNING = "게임에 쓰고 있는 백신입니다. 지우면 사용 목록에서도 빠집니다.";

describe("DeleteConfirmModal", () => {
	test("삭제 확인 제목과 지울 대상 이름을 보여 준다", () => {
		render(<DeleteConfirmModal target={TARGET} />);

		expect(screen.getByRole("heading", { name: "삭제하시겠습니까?" })).toBeTruthy();
		expect(screen.getByText(TARGET)).toBeTruthy();
	});

	test("경고 문구는 있을 때만 보여 준다", () => {
		const { rerender } = render(<DeleteConfirmModal target={TARGET} />);
		expect(screen.queryByText(WARNING)).toBeNull();

		rerender(<DeleteConfirmModal target={TARGET} warningMessage={WARNING} />);
		expect(screen.getByText(WARNING)).toBeTruthy();
	});

	test("취소와 삭제는 각자 자기 콜백만 부른다", () => {
		const onCancelClick = mock(() => {});
		const onDeleteClick = mock(() => {});
		render(
			<DeleteConfirmModal
				target={TARGET}
				onCancelClick={onCancelClick}
				onDeleteClick={onDeleteClick}
			/>,
		);

		fireEvent.click(screen.getByRole("button", { name: "취소" }));
		expect(onCancelClick).toHaveBeenCalledTimes(1);
		expect(onDeleteClick).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("button", { name: "삭제" }));
		expect(onDeleteClick).toHaveBeenCalledTimes(1);
		expect(onCancelClick).toHaveBeenCalledTimes(1);
	});
});
