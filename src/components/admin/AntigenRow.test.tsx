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

describe("AntigenRow", () => {
	test("다른 행을 수정하느라 잠긴 행에서도 ⓘ 안내는 열린다", () => {
		render(<AntigenRow value={VALUE} isEditing={false} isPinEditDeleteDisabled />);
		for (const name of ["PCV2 고정", "수정", "삭제"]) {
			expect(screen.getByRole<HTMLButtonElement>("button", { name }).disabled).toBe(true);
		}

		fireEvent.click(screen.getByRole("button", { name: "PCV2 세균 / 바이러스 구분" }));

		expect(screen.getByRole("tooltip")).toBeTruthy();
	});
});
