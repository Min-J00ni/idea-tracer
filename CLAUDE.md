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
