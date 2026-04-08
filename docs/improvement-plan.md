# IdeaTracer 개선 계획

## 현재 상태 진단 (2026-04-08)

MVP 코드는 동작하지만, 기획/리서치 단계를 건너뛰고 바로 개발에 들어간 상태.

### 구현 완료
- Next.js 16 + TypeScript + Tailwind v4
- Deepgram Nova-2 STT API Route
- GPT-4o 분석 API Route (감정/의도/키워드/관계)
- React Flow 마인드맵 (dagre 자동 레이아웃, LR 방향)
- 감정 필터, 사이드패널, 오디오 타임라인 싱크
- Notion Export API Route
- 데모 데이터 모드

### 발견된 문제
1. MindMap.tsx에 노드/엣지 계산 로직 중복
2. 감정/의도 매핑이 컴포넌트마다 산재
3. README가 기본 템플릿 상태
4. 테스트 0개, 에러 바운더리 없음
5. 경쟁 분석/시장 리서치 없이 개발 시작

---

## 개선 Phase

### Phase A — 경쟁/시장 리서치 (Claude 앱에서 진행)

**프롬프트 1:**
> "회의 녹음을 분석하는 기존 SaaS 도구들(Otter.ai, Fireflies.ai, tl;dv, Clova Note 등)의 핵심 기능, 가격, 사용자 불만을 조사해줘. 특히 '시각화' 측면에서 어떤 것이 부족한지 집중 분석해줘."

**프롬프트 2 (결과 받은 후):**
> "IdeaTracer의 차별점은 '마인드맵 시각화'야. 이 방향이 기존 도구들의 빈틈을 실제로 채울 수 있는지, 사용자 입장에서 검증해줘. 타겟 페르소나도 3가지 정도 제안해줘."

**프롬프트 3:**
> "위 내용을 바탕으로 IdeaTracer 마스터플랜 v1을 작성해줘. 비전/타겟/핵심기능/차별점/로드맵 포함."

### Phase B — 스펙 문서 보강

마스터플랜 완성 후 아래 문서를 docs/에 추가:
- `master-plan.md` — 비전/타겟/핵심기능/차별점/로드맵
- `spec-stt-pipeline.md` — STT 파이프라인 상세 스펙
- `spec-ai-analysis.md` — AI 분석 프롬프트 전략
- `spec-visualization.md` — 마인드맵 UX 스펙
- `spec-export.md` — Notion/Jira 연동 스펙

### Phase C — 코드 품질 개선

1. MindMap.tsx 중복 로직 제거
2. 감정/의도 상수를 lib/constants.ts로 통합
3. 에러 바운더리 컴포넌트 추가
4. .env.example 추가
5. README.md 재작성

### Phase D — GitHub 공개 배포

1. GitHub 레포 생성 및 push
2. Vercel 배포 연결
3. 데모 스크린샷 추가

---

## 바이브코딩 워크플로우 (참고)

1. 아이디어 → Claude 앱에서 검토
2. 추가 리서치 요청 (한 번에 1-2개씩)
3. 글로벌/국내 사례 심층 조사 → 문서화
4. 마스터플랜/개발구현서 작성
5. Claude Code/Codex에 전달 → 개발
6. 크로스 리뷰 (Claude ↔ Codex)
7. GitHub 공개 배포 + 설명서

**핵심 원칙:**
- 한 번에 너무 많이 시키지 않기 (1-2개씩)
- 문서는 업데이트보다 추가 문서로 (토큰 절약)
- 기획이 끝난 후 개발 진입 (개발 중 개입 최소화)
