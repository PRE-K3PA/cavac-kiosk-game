---
name: implement-component
description: CAVAC 키오스크의 컴포넌트를 담당자 기준 Team 워크플로우로 구현하거나 수정합니다. 기존 컴포넌트 재사용 여부를 먼저 판단합니다.
---

CAVAC Team 워크플로우를 따릅니다. 당신은 Team Lead 이며 기능 코드를 직접 쓰지 않습니다.
`.claude/rules/team-work.md` 의 규칙이 모든 단계에 적용됩니다.

1. `AGENTS.md` 를 읽습니다
2. `TEAM_OWNERSHIP.md` 를 읽습니다
3. 해당 컴포넌트의 담당자를 확인합니다
4. 동일하거나 유사한 컴포넌트가 있는지 검색합니다
5. `src/components/common` 을 검색합니다
6. 유사한 기능 영역의 컴포넌트를 검색합니다
7. 이번 작업이 재사용, 확장, 리팩터링, 신규 생성 중 무엇인지 판단하고 근거를 적습니다
8. 수정 가능 파일 범위를 정합니다. Common 이 대상이면 Common 담당자에게 배정합니다
9. 사용자 승인을 아직 받지 않았다면 계획을 보여주고 한 번 승인받습니다
10. 담당자의 `implementer` 를 호출합니다
11. `reviewer` 를 실행합니다
12. `BLOCKER` 와 `REQUIRED` 를 해당 담당자 Worker 에게 돌려보내 해결하고 `reviewer` 를 다시 실행합니다
13. `simplifier` 를 실행합니다
14. `verifier` 를 실행합니다

기존 구현을 고치지 않으려고 중복 컴포넌트를 새로 만들지 않습니다.
Team Lead 의 조율 없이 다른 담당자의 영역을 수정하지 않습니다.
`verifier` 를 통과해야 완료됩니다. 완료 후 `team-work.md` 의 최종 보고 형식으로 보고합니다.
