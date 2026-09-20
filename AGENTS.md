# AGENTS.md

AI 코딩 도구(Claude Code, Kiro 등)가 이 저장소에서 작업할 때 따라야 할 규칙입니다.
사람이 읽어도 됩니다. 팀 합의는 Notion 의 Git Convention 문서가 원본이고, 이 파일은 그중 코드에 직접 영향을 주는 것만 옮긴 것입니다.

## 이 프로젝트가 뭔지

CAVAC(중앙백신연구소) 전시 부스에 놓일 **오프라인 키오스크 게임**입니다.

- Windows exe 로 배포하며, 인터넷이 없는 환경에서 전체화면으로 돕니다
- 관람객이 터치로 30초 내외를 플레이합니다
- 게임은 두 개입니다. 백신 제조(항원 낙하), 카드 매치(메모리 게임)
- 관리자 화면에서 클라이언트가 설정을 바꿉니다
- 한국어와 영어를 모두 지원합니다
- 점수는 저장하지 않습니다. 당일 플레이 횟수만 셉니다

## 작업 방식

- 코드를 고치기 전에 관련 파일을 먼저 읽습니다. 읽지 않은 파일을 수정하지 않습니다
- 여러 파일에 걸친 변경은 무엇을 어떻게 바꿀지 먼저 제안하고, 확인을 받은 뒤 구현합니다
- 작업 중 처음 요청과 다른 범위를 건드려야 하면 멈추고 다시 확인합니다. 임의로 범위를 넓히지 않습니다
- 질문, 설명, 디버깅 논의에는 위 절차가 적용되지 않습니다. 바로 답합니다
- 완료했다고 말하기 전에 `bun run check` 를 통과시킵니다

## 절대 하면 안 되는 것

- **외부 URL 을 코드에 넣지 마세요.** CDN, 웹폰트, 이미지 호스팅 전부 금지입니다. 오프라인에서 돌아가야 합니다
- **`npm`, `yarn`, `pnpm` 명령을 쓰지 마세요.** 패키지 매니저는 bun 하나입니다
- **Bun 전용 API(`Bun.file`, `bun:sqlite` 등)를 `src/` 나 `electron/` 에 쓰지 마세요.** Bun 은 개발 도구일 뿐이고, 배포된 앱은 Electron 이 내장한 Node.js 위에서 돕니다
- **`__dirname`, `require` 를 쓰지 마세요.** 프로젝트 전체가 ESM 입니다. `import.meta.dirname` 과 `import` 를 씁니다
- **`vite.config.ts` 의 `base: "./"` 를 바꾸지 마세요.** 빌드 결과를 `file://` 로 열기 때문에 상대 경로여야 합니다
- **`package.json` 의 `"type": "module"` 을 지우지 마세요.**
- **색상을 하드코딩하지 마세요.** `src/styles/globals.css` 의 토큰만 씁니다
- **`enum`, `namespace` 를 쓰지 마세요.** `erasableSyntaxOnly` 로 막혀 있습니다. `as const` 객체를 쓰세요
- **DB 를 붙이지 마세요.** 저장은 JSON 파일로 합니다

## 코드 규칙

- 들여쓰기는 **탭**, 한 줄 최대 100자. `bun run check` 로 확인합니다
- 문자열은 큰따옴표, 세미콜론 항상, 후행 쉼표 항상
- 모든 수치는 **1920x1080 기준 px** 로 작성합니다. 화면 크기 대응은 최상위 스케일이 전담합니다
- Tailwind 는 모바일 퍼스트. 브레이크포인트는 `FHD`, `QHD`, `4K` 세 개뿐이고 `sm`, `md`, `lg` 는 없습니다
- Zustand 는 **항상 셀렉터와 함께** 씁니다. `useStore((s) => s.score)` 형태
- Zod 는 `.parse` 대신 **`.safeParse`** 를 씁니다. 부스에서 예외가 터지면 화면이 죽습니다
- `src/` 안의 import 는 **전부 `@/` 별칭**을 씁니다. 같은 폴더여도 `./` 를 쓰지 않습니다. `@/` 는 `src/` 를 가리킵니다

## 폴더 구조와 경계

```
src/
  pages/        화면 단위 (vaccine, card, admin)
  components/   재사용 UI (common, vaccine, card, admin)
  features/     게임 규칙과 도메인 로직 (vaccine-game, card-game, admin)
  layout/ store/ hooks/ types/ data/ styles/ utils/ assets/
electron/
  main/         앱 실행, 창, IPC (Node.js 영역)
  preload/      React 에 노출하는 API 계약
```

1. `features/vaccine-game` 과 `features/card-game` 은 서로 import 하지 않습니다
2. `window.api` 를 직접 부르는 파일은 `src/data/storage.ts` 하나뿐입니다. 나머지 코드는 이 파일의 함수만 씁니다
3. `components/common`, `layout/`, `hooks/` 은 특정 게임이나 관리자 코드를 import 하지 않습니다
4. 게임 진행 상태(점수, 남은 시간)는 전역 `store/` 가 아니라 해당 게임의 `features/` 안에 둡니다

## Electron

- `electron/main/` 은 Node.js 영역입니다. 창 생성, 설정 파일 읽기와 쓰기를 다룹니다
- `electron/preload/api.ts` 의 `ElectronApi` 인터페이스가 React 와의 **유일한 계약**입니다. 기능을 추가할 때는 `api.ts` 에 타입, `preload.ts` 에 연결, `ipc.ts` 에 처리, `src/data/storage.ts` 에 감싸는 함수 순서로 네 군데를 고칩니다
- 렌더러(React)는 파일 시스템에 직접 접근할 수 없습니다
- 설정 파일은 임시 파일에 쓴 뒤 이름을 바꾸는 방식으로 저장합니다. 전원이 갑자기 꺼져도 파일이 깨지지 않아야 합니다

## 키오스크 특성상 지켜야 할 것

- 예외가 화면까지 올라오지 않게 합니다. 실패하면 기본값으로 복구하고 대기 화면으로 돌아갑니다
- 게임이 끝나면 진행 상태를 반드시 초기화합니다. 다음 관람객에게 앞사람 점수가 보이면 안 됩니다
- 터치 입력 기준으로 만듭니다. hover 에만 의존하는 UI 를 만들지 마세요

## 명령어

| 명령 | 설명 |
| --- | --- |
| `bun run dev` | 개발 서버 + Electron |
| `bun run check` | Biome 검사 (PR 필수 통과) |
| `bun run check:fix` | Biome 자동 수정 |
| `bun run typecheck` | 타입 검사만 |
| `bun test` | 테스트 |
| `bun run build` | 타입 검사 후 빌드 |
| `bun run dist` | Windows exe 패키징 |
| `bun run clean:build` | 빌드 결과물 삭제 |
| `bun run clean` | 빌드 결과물과 node_modules 삭제. 이후 `bun install` 필요 |

## 브랜치와 PR

- 브랜치는 `develop` 에서 따고 `develop` 으로 병합합니다. 이름은 `#{이슈번호}-{종류}-{작업설명}`
- **커밋 메시지는 자유입니다.** `.gitmessage` 형식은 권장 사항입니다
- **PR 제목은 형식을 지킵니다.** `#<이슈번호> <타입>(<범위>): <제목>`
- 타입: `feat fix docs style refactor test chore`
- 범위: `vaccine card admin common data electron build docs`
- PR 은 `bun run check` 를 통과해야 병합할 수 있습니다
