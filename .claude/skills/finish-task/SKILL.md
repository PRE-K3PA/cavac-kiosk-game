---
name: finish-task
description: verifier 통과를 확인한 뒤 커밋 메시지와 PR 초안을 보여주고, 한 번 승인받아 commit, push, develop 대상 PR 생성까지 진행합니다.
disable-model-invocation: true
---

`AGENTS.md` 의 브랜치와 PR 규칙, `.gitmessage`, `.github/PULL_REQUEST_TEMPLATE.md` 를 따릅니다.

## 1. 상태 확인

1. `git branch --show-current` 가 `#{이슈번호}-{종류}-{작업설명}` 형식인지 확인합니다.
   `develop` 이나 `main` 이면 멈추고 `/start-task` 를 안내합니다
2. 브랜치 이름에서 이슈 번호를 꺼냅니다
3. `git status --porcelain` 와 `git diff develop...HEAD --stat` 으로 이번 작업의 변경을 모읍니다
4. 이 세션에서 `verifier` 가 모두 PASS 한 뒤 코드가 바뀌지 않았다면 그 결과를 씁니다.
   아니면 `verifier` 를 실행합니다. `FAIL` 이 하나라도 있으면 멈추고 보고합니다
5. 작업과 관련 없어 보이는 변경 파일(개인 메모, 생성 파일 등)이 있으면 목록에서 빼고 사용자에게 알립니다

## 2. 초안 만들기

타입은 `feat fix docs style refactor test chore`, 범위는
`vaccine card admin common data electron build docs` 중에서 변경 경로를 보고 고릅니다.
타입과 범위는 영어, 제목과 본문은 한국어로 씁니다.

**커밋 메시지** (`.gitmessage` 형식)

```
feat(vaccine): 결과 화면 캐러셀 추가

무엇을, 왜 바꿨는지

Resolves: #52
```

**PR 제목**: `#52 feat(vaccine): 결과 화면 캐러셀 추가`

**PR 본문**: `.github/PULL_REQUEST_TEMPLATE.md` 의 섹션을 그대로 쓰고 채웁니다.

- 설명: 무엇을, 왜
- 확인 방법: 확인 절차. 화면 변경이면 "스크린샷/gif 를 사람이 추가해야 함" 을 남깁니다
- 관련 이슈: `Closes #52`
- 체크리스트: 실제로 확인된 항목만 체크합니다
- 리뷰어를 위한 참고 사항: 담당자별 변경, cross-owner dependency, 사람이 확인해야 할 사항
- 추가 정보: verifier 결과 표

## 3. 승인 받기

다음을 한 번에 보여주고 진행, 수정, 취소 중 하나를 받습니다.

- 커밋할 파일 목록
- 커밋 메시지
- PR 제목과 본문
- push 대상: `origin "<브랜치>"`, PR 대상: `develop`

승인 없이 push 하거나 PR 을 만들지 않습니다.

## 4. 실행

1. 커밋할 파일을 경로로 지정해 `git add` 합니다. `git add -A` 나 `git add .` 를 쓰지 않습니다
2. 커밋 메시지를 `.git/CLAUDE_COMMIT_MSG` 에 써서 `git commit -F .git/CLAUDE_COMMIT_MSG` 로 커밋합니다.
   커밋할 변경이 없고 이미 커밋만 남아 있으면 이 단계를 건너뜁니다
3. `git push -u origin "<브랜치>"`. `#` 때문에 브랜치 이름은 항상 큰따옴표로 감쌉니다
4. `gh pr view "<브랜치>"` 로 이미 PR 이 있는지 확인합니다. 있으면 push 만 하고 PR 주소를 알려줍니다
5. 없으면 본문을 `.git/CLAUDE_PR_BODY.md` 에 쓰고 만듭니다.

   ```
   gh pr create --base develop --head "<브랜치>" --title "<PR 제목>" --body-file .git/CLAUDE_PR_BODY.md
   ```

6. `gh` 가 없으면 push 까지만 하고, 브라우저에서 PR 을 만들 수 있게 PR 제목과 본문,
   비교 주소를 알려줍니다. 비교 주소의 `#` 은 `%23` 으로 바꿉니다
7. 끝나면 `.git/CLAUDE_COMMIT_MSG`, `.git/CLAUDE_PR_BODY.md` 를 지웁니다

hook 을 건너뛰는 옵션(`--no-verify`)과 강제 push 를 쓰지 않습니다.
push 나 PR 생성이 실패하면 재시도하기 전에 오류를 그대로 보여주고 원인을 설명합니다.

## 5. 보고

- 커밋 해시와 메시지
- push 한 브랜치
- PR 주소
- 사람이 해야 할 일 (스크린샷 추가, 리뷰어 지정 등)
