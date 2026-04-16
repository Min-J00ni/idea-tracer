# IdeaTracer

> 회의가 끝나는 순간, 인사이트가 시작된다

AI 회의 녹음을 **인터랙티브 마인드맵**으로 변환하는 웹앱. 오디오 파일을 업로드하면 자동으로 전사 → AI 분석 → 계층형 마인드맵을 생성합니다.

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| STT 전사 | Deepgram Nova-2 기반 고품질 음성 인식 |
| AI 마인드맵 | GPT-4o가 주제·의도·감정·관계를 분석해 계층 구조로 시각화 |
| 타임스탬프 싱크 | 노드 클릭 → 해당 발언 시점으로 오디오 즉시 이동 |
| 노드 편집 | 더블클릭으로 발언 텍스트 인라인 수정 |
| 노드 삭제 | 노드 선택 후 Delete 키 |
| PNG 내보내기 | 마인드맵 전체를 고해상도 이미지로 저장 |
| Markdown 내보내기 | 주제·발언·액션아이템 구조의 .md 파일 다운로드 |
| 공유 링크 | URL 해시 방식으로 서버 없이 마인드맵 공유 |
| Notion 연동 | 발언을 Notion 데이터베이스로 직접 내보내기 |
| 데모 모드 | API 키 없이 샘플 데이터로 즉시 체험 |

---

## 스택

- **프레임워크**: Next.js 16 (App Router) + TypeScript
- **마인드맵**: React Flow + dagre 자동 레이아웃
- **스타일**: Tailwind CSS v4
- **STT**: Deepgram Nova-2
- **AI 분석**: OpenAI GPT-4o
- **이미지 내보내기**: html-to-image

---

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

```bash
cp .env.example .env.local
# .env.local에 API 키 입력
```

| 변수 | 필수 | 설명 |
|------|------|------|
| `DEEPGRAM_API_KEY` | ✅ | Deepgram 음성 인식 키 |
| `OPENAI_API_KEY` | ✅ | GPT-4o 분석 키 |
| `NOTION_API_KEY` | 선택 | Notion 내보내기 |
| `NOTION_DATABASE_ID` | 선택 | 내보낼 Notion DB ID |

### 3. 개발 서버 실행

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인.

API 키가 없다면 메인 화면 하단 **"데모 보기"** 버튼으로 샘플 데이터를 체험할 수 있습니다.

---

## 데이터 흐름

```
오디오 파일 업로드
  └→ /api/stt       Deepgram STT → 발언 목록(speaker, text, startMs, endMs)
  └→ /api/analyze   GPT-4o → 주제·감정·의도·관계·액션아이템 분석
  └→ React Flow     계층형 마인드맵 렌더링
```

---

## 마인드맵 구조

```
[주제 A] ─┬─ [발언 0]  😊 긍정 · 제안
           ├─ [발언 1]  😟 부정 · 반대
           └─ [액션]   ☐ A/B 테스트 설계 (담당: 김민준)

[주제 B] ─── [발언 2]  😐 중립 · 정보
```

- **TopicNode**: 주제 그룹 (회색)
- **UtteranceNode**: 개별 발언 (감정 색상, 중요도에 따라 테두리 두께 변화)
- **ActionNode**: 액션아이템 (파란색)

---

## 디렉토리 구조

```
src/
├── app/
│   ├── page.tsx               메인 페이지
│   └── api/
│       ├── stt/route.ts       STT API
│       ├── analyze/route.ts   AI 분석 API
│       └── export-notion/     Notion 내보내기
├── components/
│   ├── MindMap.tsx            마인드맵 컨테이너
│   ├── MindMapNode.tsx        발언 노드 (편집 가능)
│   ├── TopicNode.tsx          주제 노드
│   ├── ActionNode.tsx         액션아이템 노드
│   ├── SidePanel.tsx          발언 상세 패널
│   ├── AudioPlayer.tsx        오디오 플레이어
│   ├── EmotionFilter.tsx      감정 필터
│   ├── FileUpload.tsx         파일 업로드
│   └── ErrorBoundary.tsx      에러 바운더리
└── lib/
    ├── types.ts               TypeScript 타입 정의
    ├── constants.ts           감정·의도 설정값
    ├── layout.ts              dagre 레이아웃 유틸
    ├── export.ts              Markdown·공유 링크 유틸
    └── mock-data.ts           데모 샘플 데이터
```

---

## 로드맵

- **MVP (현재)**: 파일 업로드 → 마인드맵 → 편집·내보내기·공유
- **v1**: Zoom/Meet 실시간 봇, 크로스 미팅 뷰, 팀 플랜
- **v2**: 실시간 마인드맵, 멀티 인터뷰 패턴 분석, API 공개

자세한 내용은 [docs/master-plan.md](docs/master-plan.md) 참조.
