# Export 연동 스펙

> 마스터플랜 F-04, F-07 대응 | 작성일: 2026-04-09

---

## 1. 현재 상태

| 항목 | 구현 | 갭 |
|------|------|-----|
| Notion 내보내기 | ✅ Action Item → to_do 블록 | 전체 마인드맵 구조 미반영 |
| Jira 연동 | ❌ | — |
| Slack 연동 | ❌ | — |
| PNG 내보내기 | ❌ | — |
| PDF 내보내기 | ❌ | — |
| Markdown 내보내기 | ❌ | — |
| 공유 링크 | ❌ | — |

---

## 2. 내보내기 우선순위

| 우선순위 | 형식 | 대상 페르소나 | 시점 |
|---------|------|-------------|------|
| P0 | PNG 이미지 | 모든 사용자 (슬랙/메일 첨부) | MVP |
| P0 | Markdown | PM (문서 작성) | MVP |
| P1 | Notion 개선 | PM, 컨설턴트 | MVP |
| P1 | PDF | 컨설턴트 (보고서 첨부) | v1 |
| P2 | Jira | PM (이슈 생성) | v1 |
| P3 | Slack | PM (채널 공유) | v1 |

---

## 3. PNG 내보내기

### 3.1 구현 방법

React Flow 내장 `toImage()` 활용:

```typescript
import { useReactFlow } from "reactflow";

function ExportPNG() {
  const { getNodes, getViewport } = useReactFlow();

  async function handleExport() {
    // React Flow의 뷰포트를 캡처
    const dataUrl = await toPng(
      document.querySelector(".react-flow") as HTMLElement,
      {
        backgroundColor: "#F9FAFB",
        width: 1920,
        height: 1080,
        style: { transform: "scale(1)" },
      }
    );

    // 다운로드
    const link = document.createElement("a");
    link.download = `ideatracer-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  }
}
```

**필요 라이브러리:** `html-to-image` (경량, React Flow 공식 추천)

### 3.2 출력 품질

- 해상도: 2x (Retina 대응)
- 배경색: #F9FAFB (디자인 시스템)
- 워터마크: "Made with IdeaTracer" (Free 플랜만, 하단 우측)
- 파일명: `회의제목_YYYYMMDD.png`

---

## 4. Markdown 내보내기

### 4.1 변환 로직

```typescript
function toMarkdown(result: AnalysisResult): string {
  const lines: string[] = [];

  // 헤더
  lines.push(`# 회의 마인드맵`);
  lines.push(`> ${result.summary}`);
  lines.push("");

  // 주제별 발언
  for (const topic of result.topics) {
    lines.push(`## ${topic.title}`);
    const topicUtterances = result.utterances
      .filter((u) => u.topicId === topic.id);

    for (const u of topicUtterances) {
      const emotionIcon = EMOTION_CONFIG[u.emotion].icon;
      const time = formatMs(u.startMs);
      lines.push(`- ${emotionIcon} **[${u.speaker} ${time}]** ${u.text}`);
    }
    lines.push("");
  }

  // 액션 아이템
  if (result.actionItems.length > 0) {
    lines.push(`## 액션 아이템`);
    for (const action of result.actionItems) {
      const assignee = action.assignee ? `담당: ${action.assignee}` : "";
      const deadline = action.deadline ? `기한: ${action.deadline}` : "";
      const meta = [assignee, deadline].filter(Boolean).join(", ");
      lines.push(`- [ ] ${action.text}${meta ? ` (${meta})` : ""}`);
    }
    lines.push("");
  }

  // 핵심 결정
  if (result.decisions.length > 0) {
    lines.push(`## 핵심 결정`);
    for (const d of result.decisions) {
      lines.push(`- ${d}`);
    }
  }

  return lines.join("\n");
}
```

### 4.2 다운로드

```typescript
function downloadMarkdown(content: string, title: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${title}.md`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
```

---

## 5. Notion 내보내기 개선

### 5.1 현재 문제

- Action Item만 내보냄 (proposal + objection 필터)
- 마인드맵 구조(주제/발언/관계)가 반영되지 않음
- 회의 요약이 포함되지 않음

### 5.2 개선된 Notion 페이지 구조

```
📄 회의 마인드맵: [제목]
  ├── 📝 요약 (callout 블록)
  ├── 📊 주제 A: 온보딩 개선 (heading_2)
  │     ├── 발언 인용 (quote 블록들)
  │     └── 관련 액션아이템 (to_do)
  ├── 📊 주제 B: 데이터 트래킹 (heading_2)
  │     ├── 발언 인용
  │     └── 관련 액션아이템
  ├── ✅ 핵심 결정 (heading_2)
  │     └── 결정 사항 (bulleted_list)
  └── 📋 전체 액션 아이템 (heading_2)
        └── 체크리스트 (to_do)
```

### 5.3 Notion 블록 구성

```typescript
function buildNotionBlocks(result: AnalysisResult): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  // 요약
  blocks.push({
    type: "callout",
    callout: {
      icon: { emoji: "💡" },
      rich_text: [{ text: { content: result.summary } }],
    },
  });

  // 주제별
  for (const topic of result.topics) {
    blocks.push({
      type: "heading_2",
      heading_2: {
        rich_text: [{ text: { content: topic.title } }],
      },
    });

    // 발언 인용
    const topicUtterances = result.utterances
      .filter((u) => u.topicId === topic.id);

    for (const u of topicUtterances) {
      blocks.push({
        type: "quote",
        quote: {
          rich_text: [
            { text: { content: `[${u.speaker} ${formatMs(u.startMs)}] ` }, annotations: { bold: true } },
            { text: { content: u.text } },
          ],
        },
      });
    }

    // 주제 관련 액션아이템
    const topicActions = result.actionItems
      .filter((a) => topicUtterances.some((u) => u.index === a.sourceIndex));

    for (const action of topicActions) {
      blocks.push({
        type: "to_do",
        to_do: {
          rich_text: [{ text: { content: action.text } }],
          checked: false,
        },
      });
    }
  }

  // 핵심 결정
  if (result.decisions.length > 0) {
    blocks.push({
      type: "heading_2",
      heading_2: { rich_text: [{ text: { content: "핵심 결정" } }] },
    });
    for (const d of result.decisions) {
      blocks.push({
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: d } }],
        },
      });
    }
  }

  return blocks;
}
```

---

## 6. Jira 연동 (v1)

### 6.1 기능

액션아이템 → Jira 이슈로 생성

### 6.2 API 설계

```
POST /api/export-jira
Body: {
  actionItems: ActionItem[],
  projectKey: string,    // e.g., "IDEA"
  issueType: "Task",
  meetingTitle: string
}
```

### 6.3 Jira 이슈 매핑

| ActionItem 필드 | Jira 필드 |
|----------------|-----------|
| text | Summary |
| assignee | Assignee (Jira 사용자 검색) |
| deadline | Due Date |
| 원본 발언 | Description에 인용 포함 |
| 회의 제목 | Label 또는 Epic Link |

### 6.4 필요 환경변수

```
JIRA_BASE_URL=https://your-domain.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your_jira_api_token
```

---

## 7. 내보내기 UI

### 7.1 상단 바 버튼 구성

현재: `[Notion 내보내기] [새 회의]`

변경:
```
[내보내기 ▾] [공유] [새 회의]

내보내기 드롭다운:
  ├── 📸 PNG 이미지로 저장
  ├── 📄 Markdown으로 저장
  ├── 📑 PDF로 저장 (v1)
  ├── ─────────────
  ├── 📝 Notion에 내보내기
  └── 🎫 Jira에 내보내기 (v1)
```

### 7.2 공유 버튼

```
[공유] 클릭 시:
  ├── 🔗 링크 복사 (뷰어 전용)
  ├── ✏️ 편집 가능 링크 복사
  └── 📧 이메일로 공유 (v1)
```

---

## 8. TODO (구현 순서)

1. [ ] `html-to-image` 라이브러리 설치
2. [ ] PNG 내보내기 구현
3. [ ] Markdown 내보내기 구현
4. [ ] 내보내기 드롭다운 UI 구현
5. [ ] Notion 내보내기 개선 (주제별 구조 + 요약)
6. [ ] 공유 링크 (URL 해시 방식)
7. [ ] PDF 내보내기 (v1)
8. [ ] Jira 연동 (v1)
9. [ ] Slack 연동 (v1)
