---
name: create-issue
description: 작업 설명으로 저장소 이슈 템플릿에 맞는 GitHub 이슈 초안을 만들고, 승인받아 생성합니다. 생성 후 /start-task 로 이어갈 수 있습니다. 예: /create-issue 백신 결과 화면에 캐러셀 추가
argument-hint: <작업 설명>
disable-model-invocation: true
---

작업 설명: $ARGUMENTS

`AGENTS.md`, `TEAM_OWNERSHIP.md`, `.github/ISSUE_TEMPLATE/` 를 따릅니다.

## 1. 준비

1. 작업 설명이 없으면 사용자에게 묻고 멈춥니다
2. `gh --version` 과 `gh auth status` 로 GitHub CLI 를 확인합니다
   - 설치되어 있지 않으면 `winget install GitHub.cli` 설치 후 `! gh auth login` 을 안내하고 멈춥니다
3. `gh issue list --state open --search "<핵심 단어>"` 로 비슷한 열린 이슈가 있는지 확인합니다.
   있으면 번호와 제목을 보여주고 새로 만들지 그 이슈로 `/start-task` 를 할지 묻습니다

## 2. 종류 고르기

| 종류 | 템플릿 | 제목 접두사 | 라벨 |
| --- | --- | --- | --- |
| 새 기능, 개선 | `feature.md` | `[FEAT]` | `type: feat` |
| 버그 | `bug.md` | `[BUG]` | `type: fix` |
| 리팩터링, 테스트, 설정, 문서, 디자인 | `feature.md` | `[REFACTOR]` `[TEST]` `[CHORE]` `[DOCS]` `[STYLE]` | `type: refactor` `type: test` `type: chore` `type: docs` `type: style` |

판단이 어려우면 사용자에게 묻습니다.

## 3. 초안 만들기

- **제목**: `<접두사> <한국어 짧은 제목>`. 예: `[FEAT] 백신 결과 화면 캐러셀 추가`
- **본문**: 고른 템플릿의 섹션 제목과 순서를 그대로 씁니다. 템플릿 머리말(`---` 사이)은 넣지 않습니다
  - 작업 설명에서 알 수 있는 내용만 채웁니다. 모르는 내용을 지어내지 않고 `(작성 필요)` 로 남깁니다
  - 기능 이슈의 `완료 조건` 은 확인 가능한 체크리스트로 씁니다
  - 버그 이슈의 `재현 단계`, `환경` 이 설명에 없으면 사용자에게 물어 채우거나 `(작성 필요)` 로 남깁니다
  - 관련 경로를 알 수 있으면 `참고` 에 `TEAM_OWNERSHIP.md` 기준 예상 담당자를 적습니다
- **담당자 지정(assignee)**: 사용자가 요청한 경우에만 넣습니다. 본인이면 `@me` 를 씁니다

## 4. 승인 받기

제목, 라벨, 담당자 지정, 본문 전체를 보여주고 생성, 수정, 취소 중 하나를 받습니다.
승인 없이 이슈를 만들지 않습니다.

## 5. 생성

1. 본문을 `.git/CLAUDE_ISSUE_BODY.md` 에 씁니다
2. 이슈를 만듭니다

   ```
   gh issue create --title "<제목>" --label "<라벨>" --body-file .git/CLAUDE_ISSUE_BODY.md
   ```

   담당자를 지정하면 `--assignee "<계정>"` 을 붙입니다
3. `.git/CLAUDE_ISSUE_BODY.md` 를 지웁니다
4. 실패하면 재시도하기 전에 오류를 그대로 보여주고 원인을 설명합니다

## 6. 보고

- 이슈 번호와 주소
- `(작성 필요)` 로 남긴 항목
- 바로 작업을 시작하려면 `/start-task <이슈번호>` 를 실행하라고 안내합니다
