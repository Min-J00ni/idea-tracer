# Skill: Writing Plans (실행 계획 수립)

**언제 발동**: brainstorming으로 스펙 합의 후, 코드 작성 직전.

## 기준: "판단력 없는 주니어도 따라올 수 있게"

계획은 문맥 없는 사람이 읽어도 실행 가능해야 한다. 모호하면 다시 쓴다.

## Task 단위 규칙
- **1 task = 2~5분**. 넘으면 쪼갠다.
- 각 task는 다음을 포함:
  1. **변경 파일의 절대 경로**
  2. **before / after 코드 스니펫** (또는 구체적 diff 설명)
  3. **검증 방법** (어떤 테스트가 통과해야 하나, 수동 확인 절차)
  4. **의존 task** (순서)

## 템플릿

```markdown
# Plan: <feature-name>

## 배경
- 근거 spec: docs/spec-xxx.md
- 현재 상태: ...
- 도달 상태: ...

## Task 목록

### T1. <이름>
- 파일: src/lib/foo.ts
- 변경: <구체적으로>
- 검증: `pnpm test foo.test.ts` 통과
- 의존: 없음

### T2. ...
```

## 저장 위치
`docs/plan-<feature>-<YYYYMMDD>.md`

## 실행 규칙
- Task는 **순서대로** 실행. 완료 시 체크박스 마킹.
- 완료 전 다음 task로 넘어가지 않는다.
- Task 도중 계획 오류 발견 시: **멈추고 plan을 먼저 업데이트**한 뒤 재개.

## YAGNI 리마인더
- "나중에 쓸지도 몰라서" 추가하지 않는다.
- Feature flag / 추상화 레이어 / 미사용 옵션 금지.
