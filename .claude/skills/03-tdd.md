# Skill: Test-Driven Development

**언제 발동**: 순수 함수·유틸·API 라우트·데이터 변환 로직을 작성·수정할 때.

> 이 프로젝트는 현재 테스트가 0개다. TDD 도입이 가장 우선인 skill.

## RED → GREEN → REFACTOR

### RED — 실패하는 테스트 먼저
1. `src/**/__tests__/*.test.ts` 또는 파일 옆 `*.test.ts`에 테스트 작성
2. 실행 → **반드시 실패**해야 한다 (실패 메시지 확인)
3. 실패 이유가 "기능 없음"인지 "테스트 버그"인지 구분

### GREEN — 최소 코드로 통과
- 통과시키는 **가장 단순한** 구현만 작성
- 일반화·추상화 금지 (지금 테스트가 요구하지 않음)

### REFACTOR — 중복 제거
- 테스트가 초록인 상태에서만 리팩터
- 변경 후 다시 테스트 실행해 초록 유지

## 금지 행동
- 테스트 없이 프로덕션 코드 작성 → **발견 시 해당 코드 삭제**
- "테스트 나중에 쓰죠" → 금지
- Mock 남용으로 통과시키기 → DB/외부 API 경계에서만 mock

## 이 프로젝트 테스트 세팅 (없으면 즉시 추가)

```bash
pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

`package.json`:
```json
"scripts": { "test": "vitest" }
```

## 우선 커버할 영역
1. `src/lib/layout.ts` (dagre 레이아웃 — 순수 함수)
2. `src/lib/mock-data.ts` 변환 로직
3. `src/app/api/analyze/route.ts` 응답 파싱
4. `src/app/api/stt/route.ts` 에러 분기

UI 컴포넌트는 TDD보다 시각 확인 우선. React Flow 노드는 snapshot 대신 **행동 테스트**로.
