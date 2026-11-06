import { afterEach, describe, expect, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import AntigenRow from "@/components/admin/AntigenRow";
import type { Antigen } from "@/types/data";

afterEach(cleanup);

const VALUE: Omit<Antigen, "id"> = {
	abbr: "PCV2",
	subtype: null,
	pathogenType: "virus",
	isPinned: false,
};

function getInfoButton() {
	return screen.getByRole("button", { name: "PCV2 세균 / 바이러스 구분" });
}

/** 손가락으로 누를 때처럼 pointerdown 뒤에 click 을 보냅니다 */
function press(element: Element) {
	fireEvent.pointerDown(element);
	fireEvent.click(element);
}

describe("AntigenRow ⓘ 안내", () => {
	test("ⓘ 를 누르면 안내가 열리고, 다시 누르면 닫힌다", () => {
		render(<AntigenRow value={VALUE} isEditing={false} />);
		const infoButton = getInfoButton();
		expect(infoButton.getAttribute("aria-expanded")).toBe("false");
		expect(screen.queryByRole("tooltip")).toBeNull();

		press(infoButton);
		expect(infoButton.getAttribute("aria-expanded")).toBe("true");
		expect(infoButton.getAttribute("aria-describedby")).toBe(screen.getByRole("tooltip").id);

		press(infoButton);
		expect(infoButton.getAttribute("aria-expanded")).toBe("false");
		expect(infoButton.getAttribute("aria-describedby")).toBeNull();
		expect(screen.queryByRole("tooltip")).toBeNull();
	});

	test("바깥을 누르면 닫힌다", () => {
		render(<AntigenRow value={VALUE} isEditing={false} />);
		press(getInfoButton());

		fireEvent.pointerDown(document.body);

		expect(screen.queryByRole("tooltip")).toBeNull();
	});

	test("안내를 누르면 손을 뗄 때 닫힌다", () => {
		render(<AntigenRow value={VALUE} isEditing={false} />);
		press(getInfoButton());
		const tooltip = screen.getByRole("tooltip");

		fireEvent.pointerDown(tooltip);
		expect(screen.getByRole("tooltip")).toBeTruthy();

		fireEvent.click(tooltip);
		expect(screen.queryByRole("tooltip")).toBeNull();
	});

	test("다른 행을 수정하느라 잠긴 행에서도 ⓘ 는 열린다", () => {
		render(<AntigenRow value={VALUE} isEditing={false} isPinEditDeleteDisabled />);
		for (const name of ["PCV2 고정", "수정", "삭제"]) {
			expect(screen.getByRole<HTMLButtonElement>("button", { name }).disabled).toBe(true);
		}

		press(getInfoButton());

		expect(screen.getByRole("tooltip")).toBeTruthy();
	});
});
