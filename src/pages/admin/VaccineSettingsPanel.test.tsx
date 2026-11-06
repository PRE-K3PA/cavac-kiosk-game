import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import * as storage from "@/data/storage";
import type { Vaccine, VaccineGameSettings } from "@/types/data";

// Bun 의 mock.module 은 같이 실행되는 다른 테스트 파일에도 적용되므로 나머지 export 를 보존합니다
mock.module("@/data/storage", () => ({
	...storage,
	getImageUrl: (path: string) => `file://${path}`,
}));

const { useSettingsDraft } = await import("@/features/admin/settingsDraft");
const { default: VaccineSettingsPanel } = await import("@/pages/admin/VaccineSettingsPanel");

// 백신 목록이 비어 있으면 "백신을 1개 이상 체크해야…" 안내가 role="status" 로 함께 뜨므로,
// 힌트·패널티 경고 문구만 단독으로 확인할 수 있게 사용 백신을 하나 채워 둡니다
const DEFAULT_VACCINE: Vaccine = {
	id: "v1",
	brandName: { ko: "브랜드", en: "Brand" },
	productName: { ko: "제품", en: "Product" },
	bottleImage: { ko: "bottle-ko.png", en: "bottle-en.png" },
	logoImage: { ko: "logo-ko.png", en: "logo-en.png" },
	isEnabled: true,
	antigens: [],
};

function resetSettingsDraft() {
	useSettingsDraft.setState(useSettingsDraft.getInitialState(), true);
}

/** 원본과 초안을 같은 설정으로 맞춥니다. 저장 여부(dirty)는 이 테스트의 관심사가 아닙니다 */
function setVaccineSettings(settings: Partial<VaccineGameSettings>) {
	const initial = useSettingsDraft.getInitialState();
	const base = initial.draft["vaccine-game"];
	const data = {
		...initial.draft,
		"vaccine-game": {
			...base,
			vaccines: [DEFAULT_VACCINE],
			settings: { ...base.settings, ...settings },
		},
	};
	useSettingsDraft.setState({ ...initial, original: data, draft: data }, true);
}

function setPlayDurationSeconds(seconds: number) {
	useSettingsDraft.setState((state) => ({
		draft: { ...state.draft, common: { ...state.draft.common, playDurationSeconds: seconds } },
	}));
}

function getSettings() {
	return useSettingsDraft.getState().draft["vaccine-game"].settings;
}

beforeEach(() => {
	setVaccineSettings({});
});

afterEach(() => {
	cleanup();
	resetSettingsDraft();
});

describe("항원 낙하 속도", () => {
	test("슬라이더를 바꾸면 초안에 반영된다", () => {
		render(<VaccineSettingsPanel />);
		const slider = screen.getByRole("slider", { name: "항원 낙하 속도" });
		expect(slider.getAttribute("aria-valuenow")).toBe("100");

		fireEvent.keyDown(slider, { key: "ArrowRight" });
		expect(getSettings().fallSpeedPercent).toBe(101);
		expect(slider.getAttribute("aria-valuenow")).toBe("101");

		fireEvent.keyDown(slider, { key: "ArrowLeft" });
		expect(getSettings().fallSpeedPercent).toBe(100);
	});
});

describe("동시 등장 항원 수", () => {
	test("슬라이더를 바꾸면 초안에 반영되고 다른 설정은 그대로 둔다", () => {
		render(<VaccineSettingsPanel />);
		const slider = screen.getByRole("slider", { name: "동시 등장 항원 수" });
		expect(slider.getAttribute("aria-valuenow")).toBe("7");

		fireEvent.keyDown(slider, { key: "ArrowRight" });

		expect(getSettings().maxAntigensOnScreen).toBe(8);
		expect(getSettings().fallSpeedPercent).toBe(100);
	});
});

describe("정답 항원 힌트", () => {
	test("OFF 를 누르면 초안에 반영되고 힌트 시간 선택이 사라진다", () => {
		render(<VaccineSettingsPanel />);
		expect(screen.getByRole("button", { name: "힌트 시간" })).toBeTruthy();

		fireEvent.click(screen.getByRole("button", { name: "OFF" }));

		expect(getSettings().hint.isEnabled).toBe(false);
		expect(screen.queryByRole("button", { name: "힌트 시간" })).toBeNull();

		fireEvent.click(screen.getByRole("button", { name: "ON" }));
		expect(getSettings().hint.isEnabled).toBe(true);
		expect(screen.getByRole("button", { name: "힌트 시간" })).toBeTruthy();
	});

	test("힌트 시간을 고르면 초안에 반영된다", () => {
		render(<VaccineSettingsPanel />);

		fireEvent.click(screen.getByRole("button", { name: "힌트 시간" }));
		fireEvent.click(screen.getByRole("button", { name: "10초" }));

		expect(getSettings().hint.delaySeconds).toBe(10);
	});

	test("고른 힌트 시간이 공통 설정 초안의 제한 시간보다 길면 경고 문구를 보여 준다", () => {
		setPlayDurationSeconds(20);
		render(<VaccineSettingsPanel />);
		expect(screen.queryByRole("status")).toBeNull();

		fireEvent.click(screen.getByRole("button", { name: "힌트 시간" }));
		fireEvent.click(screen.getByRole("button", { name: "30초" }));

		expect(screen.getByRole("status").textContent).toBe(
			"제한 시간(20초) 안에 힌트가 나오지 않습니다.",
		);
	});
});

describe("오답 패널티", () => {
	test("체크를 바꾸면 초안에 반영된다", () => {
		render(<VaccineSettingsPanel />);
		const scoreCheckbox = screen.getByRole<HTMLInputElement>("checkbox", { name: "점수 차감" });
		expect(scoreCheckbox.checked).toBe(false);

		fireEvent.click(scoreCheckbox);

		expect(getSettings().penalty.score.isEnabled).toBe(true);
	});

	test("값을 바꾸면 초안에 반영된다", () => {
		render(<VaccineSettingsPanel />);
		const timeInput = screen.getByRole("textbox", { name: "시간 차감" });

		fireEvent.change(timeInput, { target: { value: "7" } });

		expect(getSettings().penalty.time.seconds).toBe(7);
	});

	test("값이 범위를 벗어나면 오류 문구를 보여 준다", () => {
		render(<VaccineSettingsPanel />);
		const timeInput = screen.getByRole("textbox", { name: "시간 차감" });

		fireEvent.change(timeInput, { target: { value: "31" } });

		expect(getSettings().penalty.time.seconds).toBe(31);
		expect(screen.getByRole("status").textContent).toBe("1~30초 사이로 입력해 주세요.");
	});

	test("값을 비운 채 체크를 끄면 설정 파일(원본)의 값으로 되돌린다", () => {
		setVaccineSettings({
			penalty: {
				time: { isEnabled: true, seconds: 7 },
				score: { isEnabled: false, points: 50 },
			},
		});
		render(<VaccineSettingsPanel />);

		fireEvent.change(screen.getByRole("textbox", { name: "시간 차감" }), {
			target: { value: "" },
		});
		expect(getSettings().penalty.time.seconds).toBe(0);
		fireEvent.click(screen.getByRole("checkbox", { name: "시간 차감" }));

		expect(getSettings().penalty.time).toEqual({ isEnabled: false, seconds: 7 });
	});
});
