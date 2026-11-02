# CAVAC Team Ownership

이 문서는 CAVAC kiosk 프로젝트의 담당 영역을 정의합니다.

Team Lead 는 임의로 담당자를 재분배하지 않습니다.
각 Worker 는 본인의 담당 영역을 우선적으로 작업하며,
다른 담당자의 영역 변경이 필요한 경우 Team Lead 를 통해 조율합니다.

---

## 김나연

### Components

- 데이터 관리
- Electron

### Screens

- 데이터 관리
- Electron

### Main responsibility

- 데이터 구조 및 관리
- 데이터 저장/불러오기
- Electron 관련 기능
- preload / IPC / desktop integration

---

## 박근원

### Components

- Admin

### Screens

- Admin 관리자 화면

### Main responsibility

- 관리자 화면 UI
- Admin 관련 컴포넌트
- 관리자 설정 인터랙션
- Admin 세부 분담 B: 입력 부품, 백신, 축종 관리, 제품, PIN 변경, 삭제 확인 컴포넌트
- Admin 세부 분담 B: 11 백신 설정, 12 카드 설정 화면과 그 오버레이, 이미지 저장

---

## 사민경

### Components

- Vaccine

### Screens

- Admin 관리자 화면

### Main responsibility

- 백신 관련 컴포넌트
- Admin 세부 분담 A: 관리자 틀, 저장·종료 흐름, 09 PIN, PIN 변경, 10 공통 설정, 축종 관리 화면

---

## 이경림

### Components

- Admin

### Screens

- 백신 제조 화면

### Main responsibility

- 백신 제조 게임 화면
- Vaccine Game 화면과 Admin 설정 연결
- Admin 세부 분담 A: 공통 기반, 관리자 틀 부품, 설정 입력, 메인 화면 동물, PIN 입력,
  이미지 미리보기 컴포넌트

---

## 이은석

### Components

- Card
- Common

### Screens

- Home
- 카드 매치 화면

### Main responsibility

- 카드 매치 게임
- 홈 화면
- 공통 UI 컴포넌트

---

# 경로별 담당자

reviewer 와 verifier 는 이 표로 OWNERSHIP 을 판정합니다.
`(확인 필요)` 표시된 경로는 팀 합의 전 초안입니다. 이 경로를 수정해야 하면
Team Lead 가 사용자에게 담당자를 먼저 확인합니다.

| 경로 | 담당자 | 비고 |
| --- | --- | --- |
| `electron/**` | 김나연 | |
| `src/data/**` | 김나연 | `window.api` 를 부르는 유일한 위치 |
| `src/store/**` | 김나연 | (확인 필요) |
| `src/types/**` | 김나연 | (확인 필요) 데이터 구조 타입 기준 |
| `src/pages/admin/**` | 사민경, 박근원 | 공동. 아래 "Admin 세부 분담" 의 화면 단위 기준 |
| `src/components/admin/**` | 이경림, 박근원 | 공동. 아래 "Admin 세부 분담" 의 컴포넌트 기준 |
| `src/features/admin/**` | 사민경, 박근원 | 공동. 그 로직을 쓰는 화면 단위의 담당자 |
| `src/components/vaccine/**` | 사민경 | |
| `src/pages/vaccine/**` | 이경림 | |
| `src/features/vaccine-game/**` | 이경림 | (확인 필요) |
| `src/components/card/**` | 이은석 | |
| `src/pages/card/**` | 이은석 | |
| `src/features/card-game/**` | 이은석 | |
| Home 화면 | 이은석 | |
| `src/components/common/**` | 이은석 | |
| `src/layout/**` | 이은석 | (확인 필요) |
| `src/hooks/**`, `src/utils/**` | 이은석 | (확인 필요) 공용 계층 |
| `src/styles/globals.css` | 이은석 | (확인 필요) 디자인 토큰 |
| `src/App.tsx`, `src/main.tsx` | 없음 | 수정 전 사용자 승인 |
| 설정 파일 (`package.json`, `vite.config.ts`, `biome.json`, `tsconfig.json` 등) | 없음 | 수정 전 사용자 승인 |
| `AGENTS.md`, `TEAM_OWNERSHIP.md`, `.claude/**` | 없음 | 수정 전 사용자 승인 |

---

# Admin 세부 분담

2026-10-08 분담안 기준입니다. 원본: Figma `키오스크 UIUX` › `Components` › `Admin`, `Screens · KO` 관리자 섹션.
Figma 에서 다른 컴포넌트를 안에 품은 컴포넌트는 같은 사람이 맡습니다.
파일 이름은 컴포넌트 이름과 같게 짓고(`src/components/admin/AnimalPicker.tsx`), 담당은 이름으로 판정합니다.

## 컴포넌트 (`src/components/admin/**`)

| 담당 | 묶음 | 컴포넌트 |
| --- | --- | --- |
| 이경림 (A) | A1 공통 기반 **(가장 먼저)** | `Button`, `ModalHeader`, `_Icon` 6종 (Search, Chevron, Check, Alert, Pin, Empty) |
| 이경림 (A) | A2 화면 틀과 저장 | `AdminHeader`, `InlineNotice`, `SettingsTab`, `SectionHeader`, `SaveBar`, `SavedModal`, `SaveFailedModal`, `ConfirmModal`, `EmptyState` |
| 이경림 (A) | A3 설정 입력 | `Slider`, `Select`, `OptionButton` |
| 이경림 (A) | A4 메인 화면 동물 | `AnimalPicker`, `AnimalOption`, `HomeAnimalSlot` |
| 이경림 (A) | A5 PIN 입력 | `PINPanel` |
| 이경림 (A) | A6 이미지 미리보기 | `ImagePreviewModal` |
| 박근원 (B) | B1 입력 부품 | `TextInput`, `FieldMessage`, `ImageField`, `Checkbox`, `PenaltyRow`, `AddButton` |
| 박근원 (B) | B2 백신 | `VaccineRow`, `AntigenRow`, `VaccineModal` |
| 박근원 (B) | B3 축종 관리 | `SpeciesManagerModal`, `SpeciesCard`, `SpeciesModal` |
| 박근원 (B) | B4 제품 | `ProductRow`, `ProductModal` |
| 박근원 (B) | B5 PIN 변경 | `PINChangeModal` |
| 박근원 (B) | B6 삭제 확인 | `DeleteConfirmModal` |

## 화면 (`src/pages/admin/**`, `src/features/admin/**`)

세로(`_Portrait`) 프레임, 오류·상태 프레임, 그 화면에서 여는 오버레이는 가로 화면과 같은 담당입니다.
10~12 화면의 헤더, 탭, 저장 막대는 사민경의 `관리자 틀` 이고, 박근원은 그 아래 설정 영역을 맡습니다.

| 담당 | 화면 단위 | 프레임 |
| --- | --- | --- |
| 사민경 (A) | 관리자 틀 **(가장 먼저)** | 10~12 공통 헤더, 탭, 저장 막대 |
| 사민경 (A) | 저장·종료 흐름 | `SettingsSavedOverlay*`, `ExitConfirmOverlay_*`, `DiscardConfirmOverlay_*`, `SaveFailedOverlay` |
| 사민경 (A) | 09 PIN | `09_Admin_PIN`, `09_Admin_PIN_Error` |
| 사민경 (A) | PIN 변경 | `PINChangeOverlay*` |
| 사민경 (A) | 운영 게임·제한 시간·자동 초기화 | `10_Admin_Settings_Common` 과 `_Unsaved_Card`, `_SavedCard`, `_Unsaved_Vaccine` |
| 사민경 (A) | 메인 화면 동물 칸 | `10_Admin_Settings_Common_SlotEmptySelected`, `_AnimalPlaced`, `_SlotFilledSelected` |
| 사민경 (A) | 축종 관리 흐름 | `Species*Overlay*`, `ImagePreviewOverlay_Character1~4` |
| 박근원 (B) | 이미지 저장 **(가장 먼저)** | 축종, 백신, 제품 이미지 저장 (화면 쪽 연결) |
| 박근원 (B) | 게임 설정 | `11_Admin_Settings_Vaccine`, `_HintWarning`, `_PenaltyEmpty` |
| 박근원 (B) | 백신 관리 목록 | `11_Admin_Settings_Vaccine_AntigenEditing`, `_Empty`, `_LimitReached`, `_SearchEmpty`, `_AntigenDuplicate`, `_AntigenEditingSave` |
| 박근원 (B) | 백신 오버레이 흐름 | `VaccineAddOverlay*`, `VaccineEditOverlay`, `VaccineDeleteOverlay`, `AntigenDeleteOverlay`, `ImagePreviewOverlay_VaccineImage`, `_VaccineLogo` |
| 박근원 (B) | 카드 쌍 수·오답 패널티 | `12_Admin_Settings_Card` |
| 박근원 (B) | 제품 등록 목록 | `12_Admin_Settings_Card_Empty`, `_ProductsOver`, `_ProductsShort` |
| 박근원 (B) | 제품 오버레이 흐름 | `ProductAddOverlay`, `ProductEditOverlay`, `ProductDeleteOverlay`, `ImagePreviewOverlay_ProductImage` |

`_HintWarning`, `_ProductsOver` 는 필요한지 아직 정해지지 않았습니다.

## 선행 작업과 담당자 간 의존

다른 담당자의 컴포넌트를 **가져다 쓰는 것**은 자유입니다. 그 컴포넌트를 **고쳐야 하면** 담당자에게 요청합니다.

| 먼저 만드는 쪽 | 만드는 것 | 기다리는 쪽 |
| --- | --- | --- |
| 이경림 | `Button`, `ModalHeader`, `_Icon` | 박근원 컴포넌트 대부분 |
| 사민경 | 관리자 틀 | 박근원의 11·12 화면 |
| 박근원 | 이미지 저장 | 사민경의 축종 관리 흐름 |
| 김나연 | 이미지와 설정 저장 IPC (`electron/**`, `src/data/**`) | 박근원의 이미지 저장, 모든 저장 흐름 |

엇갈려 쓰는 곳:

- 사민경 화면이 박근원 컴포넌트를 씁니다: `PINChangeModal`, `SpeciesManagerModal`, `SpeciesCard`, `SpeciesModal`, `DeleteConfirmModal`
- 박근원의 `ImageField` 가 이경림의 `ImagePreviewModal` 을 엽니다
- 이경림의 `ImagePreviewModal` 과 박근원의 `ProductModal` 은 게임 컴포넌트를 줄여 보여 줍니다.
  게임 컴포넌트를 고쳐야 하면 `src/components/card` 는 이은석, `src/components/vaccine` 은 사민경에게 요청합니다
- Admin `Button` 이 `src/components/common` 의 버튼과 겹치면 새로 만들지 말고 이은석과 조율합니다

---

# Ownership Rules

## 1. 기존 담당 우선

Team Lead 는 작업 내용을 확인한 뒤 새로운 담당자를 지정하지 않습니다.
기존 담당 범위에 따라 적절한 Worker 를 호출합니다.

## 2. 담당 영역 중복

Admin 은 "Admin 세부 분담" 표로 ownership 을 정합니다. 표에 없는 파일이나 여러 화면 단위가 함께 쓰는
파일은 작업 시작 시 Team Lead 가 실제 변경 파일을 기준으로 확정하고, 판단이 어려우면 사용자에게 확인합니다.

동일 파일을 두 Worker 가 동시에 수정하지 않습니다.

## 3. Common

Common 의 담당자는 이은석입니다.

다른 Worker 가 공통 기능이 필요하다고 판단해도 독립적으로 Common 컴포넌트를 새로 만들지 않습니다.
다음 절차를 따릅니다.

1. 기존 Common 검색
2. 재사용 가능 여부 확인
3. Team Lead 에게 shared change 요청
4. Team Lead 가 Common 담당자에게 변경 할당

## 4. Cross-owner dependency

다른 담당자의 변경이 필요한 경우:

1. 직접 수정하지 않습니다.
2. Team Lead 에게 dependency 를 보고합니다.
3. Team Lead 가 해당 담당자에게 작업을 요청합니다.
4. dependency 해결 후 기존 작업을 계속합니다.

강한 의존성과 약한 의존성의 구분은 `.claude/rules/team-work.md` 를 따릅니다.

## 5. File ownership

병렬 작업 전 Team Lead 는 각 Worker 가 수정할 파일 범위를 정합니다.
동일 파일에 둘 이상의 active owner 를 허용하지 않습니다.
