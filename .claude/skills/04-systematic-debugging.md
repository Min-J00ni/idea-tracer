# Skill: Systematic Debugging (4단계 근본원인 추적)

**언제 발동**: 에러 로그, 예상과 다른 동작, 재현 가능한 버그.

## 금지: 증상 패치
- `try/catch`로 에러 삼키기
- `if (!foo) return` 으로 조용히 넘기기
- `setTimeout` 으로 타이밍 이슈 우회
- "일단 새로고침하면 되니까" 방치

## 4단계 절차

### 1. 재현 (Reproduce)
- 최소 재현 단계를 **글로** 적는다
- 100% 재현되는가? 간헐적이면 조건을 찾는다

### 2. 격리 (Isolate)
- 버그가 발생하는 가장 좁은 코드 범위를 찾는다
- `git bisect` / 로그 / 바인딩 분리
- "어디서 망가지는가"가 명확해질 때까지 좁힌다

### 3. 근본원인 가설 (Hypothesize)
- **왜 이게 발생하는가?** 를 한 문장으로 쓴다
- 그 가설이 맞다면 어떤 증거가 관찰되어야 하는지 예측
- 로그/테스트로 증거 수집 → 가설 검증

### 4. 수정 + 회귀 테스트 (Fix + Regression Test)
- 근본원인을 제거하는 수정을 한다 (증상 마스킹 아님)
- **수정 전에 실패하던 테스트가 수정 후 통과**하는 회귀 테스트 추가
- 테스트 없이 "고쳤어요" 선언 금지

## 이 프로젝트 흔한 버그 지점
- Deepgram 응답 구조 변경 → `src/app/api/stt/route.ts`
- GPT-4o JSON 파싱 실패 → `src/app/api/analyze/route.ts`
- React Flow 노드 id 충돌 → `src/components/MindMap.tsx`
- dagre 레이아웃 재계산 누락 → `src/lib/layout.ts`

## 사용자 보고 시
"X라서 Y를 Z로 고쳤습니다" — **근본원인·변경지점·검증증거** 3가지를 함께.
