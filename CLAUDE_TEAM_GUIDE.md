# Claude Code Team 워크플로우 도입 안내

Claude Code 로 작업할 때 **담당 영역을 지키고, 이슈부터 PR 까지 같은 절차로** 진행하도록
규칙과 자동화를 추가했습니다.

## 무엇이 바뀌었나

| 파일 | 내용 |
| --- | --- |
| `TEAM_OWNERSHIP.md` (신규) | 담당자별 영역과 **경로별 담당자 표**. 누가 어떤 파일을 고치는지의 기준 |
| `AGENTS.md` (수정) | "Team 작업 승인 방식" 섹션 추가 |
| `.gitattributes` (신규) | 줄바꿈을 LF 로 통일, 이미지와 폰트는 바이너리 처리 |
| `.claude/rules/` | `clean-code.md` (재사용 우선, 컴포넌트와 함수 규칙), `team-work.md` (Team 작업 절차) |
| `.claude/agents/` | `implementer` 구현, `reviewer` 리뷰, `simplifier` 정리, `verifier` 최종 검증 |
| `.claude/skills/` | 슬래시 명령 6개 (아래 표) |
| `.claude/hooks/` | npm, yarn, pnpm 차단, 강제 push 와 main/develop 직접 push 차단, 응답이 끝날 때 check 와 typecheck 자동 실행 |
| `.claude/settings.json` | 위 hook 연결, 자주 쓰는 안전한 명령은 묻지 않고 허용 |

## 처음 한 번만 설정

1. **develop 최신화**: `git switch develop` 후 `git pull`
2. **bun 확인**: `bun --version`. hook 이 bun 으로 돌아서 없으면 동작하지 않습니다
3. **GitHub CLI 설치와 로그인**

   ```
   winget install GitHub.cli
   gh auth login --web --git-protocol https
   gh auth setup-git
   ```

   - `gh auth login` 을 실행하면 터미널에 `XXXX-XXXX` 형식의 코드가 나옵니다.
     https://github.com/login/device 에 그 코드를 넣고 **Authorize** 를 누릅니다
   - Claude Code 안에서 실행할 때는 앞에 `!` 를 붙입니다. 예: `! gh auth login --web --git-protocol https`
   - 확인: `gh auth status` 에 `Logged in` 이 보이면 됩니다
4. **Claude Code 실행**: 저장소 폴더에서 `claude` 를 실행합니다. 프로젝트 설정(hooks)을
   신뢰할지 물으면 허용합니다
5. **줄바꿈 정리 (필요할 때만)**: pull 뒤 수정하지 않은 파일이 잔뜩 변경됨으로 보이면
   줄바꿈 차이 때문입니다. **커밋 안 한 작업이 없는지 먼저 확인한 뒤** 아래를 실행합니다

   ```
   git rm -r --cached . -q
   git reset --hard
   ```

## 작업 흐름

```
/create-issue <설명>  →  /start-task 52  →  계획 확인 후 승인  →  구현, 리뷰, 정리, 검증 (자동)  →  /finish-task
```

| 명령 | 언제 | 하는 일 |
| --- | --- | --- |
| `/create-issue <작업 설명>` | 이슈가 없을 때 | 이슈 템플릿에 맞춰 제목, 본문, 라벨 초안 작성, **승인 후** GitHub 이슈 생성 |
| `/start-task <이슈번호>` | 작업 시작 | 이슈 읽기, develop 최신화, 브랜치 생성 (`#52-feat-...`), 담당자별 파일 범위 계획. **여기서 한 번 승인** |
| `/implement-screen` | 화면 작업 | start-task 가 자동으로 이어서 실행 |
| `/implement-component` | 컴포넌트 작업 | 기존 컴포넌트 재사용 여부를 먼저 판단 |
| `/fix-issue` | 버그 | 원인을 찾아 최소 범위만 수정 |
| `/finish-task` | 작업 끝 | verifier 통과 확인, 커밋 메시지와 PR 초안 표시, **승인 후** commit, push, develop 대상 PR 생성 |

보통은 `/create-issue`, `/start-task`, `/finish-task` 세 개만 직접 입력하면 됩니다.
이슈가 이미 있으면 `/create-issue` 는 건너뜁니다.

## 꼭 알아둘 것

- **내 담당 영역만 고칩니다.** 다른 사람 영역의 변경이 필요하면 Claude 가 직접 고치지 않고
  "의존성" 으로 보고합니다. 해당 담당자에게 전달해 주세요
- `TEAM_OWNERSHIP.md` 에서 `(확인 필요)` 이거나 담당자가 `없음` 인 경로(`App.tsx`, 설정 파일,
  `.claude/` 등)는 Claude 가 수정 전에 물어봅니다
- Common 컴포넌트(`src/components/common`)는 이은석 담당입니다. 필요하면 새로 만들지 말고 요청합니다
- `main`, `develop` 에 직접 push 하거나 강제 push 를 하면 hook 이 막습니다. 항상 브랜치에서 PR 로 병합합니다
- Claude 가 응답을 끝낼 때 `bun run check` 와 `typecheck` 가 자동으로 돌고, 실패하면 Claude 가 이어서 고칩니다
- PR 제목 형식: `#<이슈번호> <타입>(<범위>): <제목>`. `/finish-task` 가 맞춰서 만들어 줍니다

## 아직 확인이 필요한 것

`TEAM_OWNERSHIP.md` 의 `(확인 필요)` 경로(`src/store`, `src/types`, `src/layout`, `src/hooks`,
`src/utils`, `globals.css`, `features/vaccine-game`)의 담당자를 팀에서 확정해 주세요.
