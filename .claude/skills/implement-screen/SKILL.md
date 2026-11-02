---
name: implement-screen
description: CAVAC 키오스크의 화면(pages)을 담당자 기준 Team 워크플로우로 구현하거나 수정합니다. 구현, 리뷰, 단순화, 검증까지 진행합니다.
---

CAVAC Team 워크플로우를 따릅니다. 당신은 Team Lead 이며 기능 코드를 직접 쓰지 않습니다.
`.claude/rules/team-work.md` 의 규칙이 모든 단계에 적용됩니다.

1. `AGENTS.md` 를 읽습니다
2. `TEAM_OWNERSHIP.md` 를 읽습니다
3. 요청된 화면의 기존 담당자를 확인합니다
4. 대상 화면의 현재 구현을 확인합니다
5. 가장 유사한 기존 화면을 확인합니다
6. 관련 컴포넌트를 확인합니다
7. `src/components/common` 을 확인합니다
8. 관련 `features/` 로직을 확인합니다
9. 담당자 간 의존성을 확인합니다
10. Worker 별 수정 가능 파일 범위를 정하고, 겹치지 않는지 확인합니다
11. 사용자 승인을 아직 받지 않았다면 계획을 보여주고 한 번 승인받습니다
12. 담당자마다 `implementer` 를 호출합니다. 범위가 겹치지 않는 Worker 는 한 메시지에서 병렬로 호출합니다
13. Worker 보고의 `Dependencies` 를 처리합니다. 강한 의존성은 해당 담당자 Worker 에게 배정하고,
    끝난 뒤 원래 Worker 를 다시 호출합니다
14. `reviewer` 를 실행합니다
15. `BLOCKER` 와 `REQUIRED` 를 해당 담당자 Worker 에게 돌려보내 해결하고 `reviewer` 를 다시 실행합니다
16. `simplifier` 를 실행합니다
17. `verifier` 를 실행합니다

담당 영역을 임의로 재분배하지 않습니다.
저장소 조사 단계를 생략하지 않습니다.
수정 가능한 파일 범위가 겹치도록 허용하지 않습니다.
`verifier` 를 통과해야 화면 작업이 완료됩니다. 완료 후 `team-work.md` 의 최종 보고 형식으로 보고합니다.
