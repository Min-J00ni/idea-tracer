# Idea Tracer

AI 회의 녹음을 마인드맵으로 시각화하고 외부 업무 툴과 연동하는 웹앱.

## Stack
- Next.js 14 App Router + TypeScript
- React Flow (마인드맵 엔진) + dagre (자동 레이아웃)
- Tailwind CSS (스타일)
- Deepgram Nova-2 (STT)
- OpenAI GPT-4o (AI 분석)
- Notion API (Task Export)

## Design System
- Background: #F9FAFB
- Node: white, rounded-xl, shadow-sm
- Emotion: positive #10B981 / negative #EF4444 / neutral #9CA3AF / conflict #F59E0B
- Font: Geist, Inter, Pretendard

## Data Flow
오디오 파일 → Deepgram STT → GPT-4o 분석 → React Flow 마인드맵 → UI

## Key Files
- 메인 페이지: src/app/page.tsx
- STT API: src/app/api/stt/route.ts
- AI 분석 API: src/app/api/analyze/route.ts
- Notion Export: src/app/api/export-notion/route.ts
- 마인드맵: src/components/MindMap.tsx
- 노드: src/components/MindMapNode.tsx
- 사이드패널: src/components/SidePanel.tsx
- 오디오 플레이어: src/components/AudioPlayer.tsx
- 타입 정의: src/lib/types.ts
- dagre 레이아웃: src/lib/layout.ts
- 데모 데이터: src/lib/mock-data.ts

## Rules
- API Key는 .env.local에만 저장, 절대 프론트엔드 노출 금지
- 컴포넌트는 단일 책임 원칙
- 반응형 필수: web(우클릭), mobile(롱클릭) 인터랙션 분리

## Workflow (MANDATORY — Superpowers 포팅)
모든 작업은 `.claude/skills/`의 워크플로우를 **반드시** 따른다. 건너뛰면 안 된다.

1. **새 기능/수정 요청** → `.claude/skills/01-brainstorming.md` 먼저 (바로 코드 작성 금지)
2. **스펙 합의 후** → `.claude/skills/02-writing-plans.md` 로 task 분해 (2-5분 단위)
3. **코드 작성** → `.claude/skills/03-tdd.md` RED-GREEN-REFACTOR (테스트 없이 프로덕션 코드 금지)
4. **버그 대응** → `.claude/skills/04-systematic-debugging.md` 4단계 (증상 패치 금지)
5. **완료 선언 전** → `.claude/skills/05-verification.md` 체크리스트 (증거 없이 "됐다" 금지)

핵심 원칙: **Evidence over claims · Systematic over ad-hoc · TDD always · YAGNI/DRY · Root cause over symptom**

작업 시작 시 어떤 skill을 적용할지 먼저 선언하고 진행한다. 상세 지침은 `.claude/skills/README.md` 참조.
