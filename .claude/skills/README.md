# Idea Tracer 작업 워크플로우 (Superpowers 포팅)

[obra/superpowers](https://github.com/obra/superpowers)의 핵심 skill을 이 프로젝트에 맞춰 이식한 로컬 워크플로우.
**모든 작업은 아래 순서를 따른다. 건너뛰면 안 된다.**

## 작업 단계별 강제 워크플로우

| 트리거 | 적용 skill | 파일 |
|---|---|---|
| 새 기능/수정 요청을 받음 | **brainstorming** | [01-brainstorming.md](01-brainstorming.md) |
| 스펙 합의 완료 | **writing-plans** | [02-writing-plans.md](02-writing-plans.md) |
| 코드 작성 시작 | **tdd** | [03-tdd.md](03-tdd.md) |
| 버그/에러 발견 | **systematic-debugging** | [04-systematic-debugging.md](04-systematic-debugging.md) |
| "완료" 선언 직전 | **verification-before-completion** | [05-verification.md](05-verification.md) |

## 핵심 원칙 (Superpowers 철학)

1. **Evidence over claims** — "될 거예요" 금지. 실행 로그/스크린샷/테스트 결과로 증명.
2. **Systematic over ad-hoc** — 즉흥 대응 대신 정의된 절차를 따른다.
3. **TDD always** — 실패하는 테스트 없이 프로덕션 코드를 쓰지 않는다.
4. **YAGNI / DRY** — 지금 필요 없는 건 만들지 않는다. 중복은 즉시 제거.
5. **Root cause, not symptom** — 증상 패치(try/catch로 덮기 등)는 금지.

## 에이전트 체크리스트

작업 시작 전 스스로 확인:
- [ ] 요청이 모호한가? → brainstorming 먼저
- [ ] 스펙은 문서화됐는가? → `docs/spec-*.md` 참고/추가
- [ ] 테스트부터 썼는가?
- [ ] 변경 범위가 task 1개 단위(2-5분)인가?
- [ ] "됐다"고 말하기 전에 실제로 검증했는가?
