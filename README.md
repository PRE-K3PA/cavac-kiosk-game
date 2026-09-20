# CAVAC 키오스크 게임

CAVAC(중앙백신연구소) 전시 부스용 오프라인 키오스크 게임입니다. Windows exe 로 배포되며, 인터넷 없이 전체화면 터치로 동작합니다.

## 기술 스택

| 영역 | 도구 |
| --- | --- |
| 런타임, 패키지 | Bun 1.4.2 |
| 언어, 빌드 | TypeScript, Vite |
| UI | React, Tailwind, cva, clsx, tailwind-merge |
| 상태, 검증 | Zustand, Zod |
| 애니메이션 | GSAP, Motion |
| 포맷, 린트 | Biome |
| 테스트 | bun test, React Testing Library |
| 배포 | Electron, electron-builder |

## 시작하기

Bun 버전은 `mise.toml` 에 고정되어 있습니다. [mise](https://mise.jdx.dev) 를 쓰면 자동으로 맞춰집니다.

```bash
bun install
git config commit.template .gitmessage
bun run dev
```

`git config` 한 줄은 커밋할 때 메시지 형식이 뜨게 하는 설정입니다. 커밋 메시지는 자유이고 형식은 권장 사항입니다. PR 제목만 `#<이슈번호> <타입>(<범위>): <제목>` 형식을 지키면 됩니다.

## 명령어

| 명령 | 설명 |
| --- | --- |
| `bun run dev` | 개발 서버 + Electron 실행 |
| `bun run build` | 타입 검사 후 빌드 |
| `bun run preview` | 빌드 결과 미리보기 |
| `bun run dist` | Windows exe 패키징 |
| `bun run check` | Biome 검사 (PR 필수 통과) |
| `bun run check:fix` | Biome 자동 수정 |
| `bun run typecheck` | 타입 검사만 실행 |
| `bun test` | 테스트 실행 |
| `bun run clean` | 빌드 결과물과 node_modules 삭제 |
| `bun run clean:build` | 빌드 결과물만 삭제 |

## 폴더 구조

```
.github/               이슈, PR 템플릿과 CI 워크플로
electron/
  main/                앱 실행, 창 생성, IPC (Node.js 영역)
  preload/             React 에 노출하는 API 계약
resources/             패키징용 리소스 (icon.ico)
src/
  pages/               화면 단위 (vaccine, card, admin)
  components/          재사용 UI (common, vaccine, card, admin)
  features/
    vaccine-game/      백신 제조 게임 로직 (hooks, utils)
    card-game/         카드 매치 게임 로직 (hooks, utils)
    admin/             관리자 로직 (modals, validation, utils)
  layout/              전역 레이아웃
  store/               Zustand 전역 상태
  hooks/               공통 커스텀 훅
  types/               공통 타입
  data/                초기 설정값, 제품 데이터
  styles/              전역 스타일, 디자인 토큰
  utils/               공용 함수
  assets/              이미지, 사운드, 폰트
```

## 규칙

- 컨벤션은 Notion 의 **Git Convention** 문서를 따릅니다
- AI 코딩 도구 사용 시 [AGENTS.md](./AGENTS.md) 를 참고합니다
- 패키지 매니저는 bun 하나만 사용합니다
