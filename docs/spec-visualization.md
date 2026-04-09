# 마인드맵 시각화 UX 스펙

> 마스터플랜 F-02, F-04 대응 | 작성일: 2026-04-09

---

## 1. 현재 상태

| 항목 | 구현 | 갭 |
|------|------|-----|
| React Flow 렌더링 | ✅ | — |
| dagre 자동 레이아웃 | ✅ LR 방향 | 레이아웃 변경 옵션 없음 |
| 감정별 노드 색상 | ✅ 4색 | — |
| 의도 배지 | ✅ 5종 | — |
| 감정 필터 | ✅ on/off | — |
| 노드 클릭 → 사이드패널 | ✅ | — |
| 타임스탬프 → 오디오 점프 | ✅ | — |
| 오디오 재생 중 노드 하이라이트 | ✅ | — |
| **계층 구조 (주제→발언)** | ❌ | 플랫 구조만 존재 |
| **노드 편집** | ❌ | 읽기 전용 |
| **공유 링크** | ❌ | — |
| **내보내기 (PNG/PDF/MD)** | ❌ | Notion만 가능 |
| **중복 코드** | ⚠️ | MindMap.tsx에 노드/엣지 계산 2회 반복 |

---

## 2. 마인드맵 구조 변경

### 2.1 현재: 플랫 네트워크

```
[발언0] ──── [발언1]
   │
[발언2] ──── [발언4]
   │
[발언3] ──── [발언5]
```

모든 노드가 동일 타입, 동일 크기. 구조 파악이 어려움.

### 2.2 목표: 계층적 마인드맵

```
            ┌── [발언0] ── [발언3]
[주제 A] ──┤
            └── [액션: A/B 테스트]

            ┌── [발언2]
[주제 B] ──┤
            └── [발언4]

[합의] ──── [발언5]
```

### 2.3 노드 타입 3종

| 타입 | 용도 | 시각적 차이 |
|------|------|------------|
| `topic` | 주제 그룹 노드 | 큰 노드, 볼드 텍스트, 회색 배경 |
| `utterance` | 개별 발언 | 현재와 동일 (감정 색상) |
| `action` | 액션아이템 | 체크박스 아이콘, 파란 테두리 |

```typescript
// React Flow nodeTypes 확장
const nodeTypes = {
  topic: TopicNode,       // NEW
  utterance: MindMapNode, // 기존 (이름 변경)
  action: ActionNode,     // NEW
};
```

---

## 3. 노드 디자인 상세

### 3.1 Topic 노드 (신규)

```
┌─────────────────────────────────┐
│  📋  온보딩 개선                  │  ← 주제 제목
│  발언 3개 · 중요도 높음            │  ← 메타 정보
└─────────────────────────────────┘
```

- 크기: 너비 200px, 높이 60px
- 배경: #F3F4F6 (연한 회색)
- 테두리: 2px solid #D1D5DB
- 폰트: 14px bold
- 클릭 시: 소속 발언 노드 하이라이트

### 3.2 Utterance 노드 (기존 개선)

현재 디자인 유지하되 변경사항:

- **중요도 시각화**: importance 값에 따라 노드 크기/테두리 굵기 변화
  - importance ≥ 0.8: 테두리 3px, 약간 큰 폰트
  - importance ≥ 0.5: 테두리 2px (기본)
  - importance < 0.5: 테두리 1px, 약간 작은 폰트
- **관계 유형 엣지**: relationType에 따라 엣지 스타일 변경
  - supports: 실선 (현재)
  - opposes: 빨간 점선
  - extends: 회색 실선
  - resolves: 초록 실선 + 화살표

### 3.3 Action 노드 (신규)

```
┌─────────────────────────────────┐
│  ☐  A/B 테스트 설계               │  ← 액션 내용
│  👤 김민준 · 📅 2주 내            │  ← 담당자/기한
└─────────────────────────────────┘
```

- 크기: 너비 220px, 높이 50px
- 배경: #EFF6FF (연한 파랑)
- 테두리: 2px solid #3B82F6
- 체크박스: 클릭으로 완료 표시 가능

---

## 4. 레이아웃 옵션

### 4.1 MVP: LR (좌→우) 고정

현재 구현 유지. 시간 흐름에 자연스러운 방향.

### 4.2 v1: 레이아웃 전환 버튼

| 레이아웃 | dagre rankdir | 용도 |
|----------|---------------|------|
| 타임라인 (→) | LR | 시간 순서 파악 |
| 트리 (↓) | TB | 계층 구조 파악 |
| 방사형 | 커스텀 | 주제 중심 탐색 |

```typescript
// layout.ts 확장
type LayoutDirection = "LR" | "TB" | "radial";

function getLayoutedElements(
  nodes: Node[], 
  edges: Edge[], 
  direction: LayoutDirection = "LR"
) {
  if (direction === "radial") return getRadialLayout(nodes, edges);
  // dagre 사용
  g.setGraph({ rankdir: direction, nodesep: 60, ranksep: 120 });
  // ...
}
```

---

## 5. 노드 편집 기능 (F-04)

### 5.1 MVP 편집 범위

| 기능 | 인터랙션 | 구현 방식 |
|------|----------|----------|
| 노드 이동 | 드래그 | React Flow 기본 (이미 동작) |
| 노드 텍스트 수정 | 더블클릭 → 인라인 편집 | contentEditable + onBlur 저장 |
| 노드 삭제 | 노드 선택 → Delete 키 | onNodesDelete 핸들러 |
| 노드 추가 | 빈 공간 더블클릭 | 빈 노드 생성 → 즉시 편집 모드 |
| 엣지 추가 | 노드 핸들에서 드래그 | React Flow onConnect |
| 엣지 삭제 | 엣지 클릭 → Delete 키 | onEdgesDelete 핸들러 |

### 5.2 모바일 인터랙션 (반응형)

| 기능 | 웹 (마우스) | 모바일 (터치) |
|------|------------|-------------|
| 노드 상세 보기 | 클릭 | 탭 |
| 노드 편집 | 더블클릭 | 더블탭 |
| 컨텍스트 메뉴 | 우클릭 | 롱프레스 (500ms) |
| 노드 이동 | 드래그 | 롱프레스 후 드래그 |
| 줌 | 스크롤 | 핀치 |
| 팬 | 드래그 (빈 공간) | 드래그 (빈 공간) |

---

## 6. 공유 기능 (F-04)

### 6.1 공유 링크 구조

```
https://ideatracer.app/share/{shareId}
```

- shareId: UUID v4
- 권한: `view` (기본) / `edit`
- 만료: 30일 (Free) / 무제한 (Pro)

### 6.2 구현 방향 (MVP)

MVP에서는 서버 저장소가 없으므로, **URL 해시에 데이터 인코딩**하는 방식으로 시작:

```
https://ideatracer.app/share#data={base64EncodedJSON}
```

- 장점: 서버 불필요, 즉시 구현 가능
- 단점: URL 길이 제한 (약 2000자), 대형 회의 불가
- v1에서 서버 저장소로 전환

---

## 7. 내보내기 (F-04)

### 7.1 지원 형식

| 형식 | 구현 방법 | 우선순위 |
|------|----------|----------|
| PNG | React Flow의 `toImage()` | MVP |
| PDF | html2canvas → jsPDF | MVP |
| Markdown | 커스텀 변환 (주제→H2, 발언→bullet) | MVP |
| Notion | 현재 구현 유지 | ✅ 완료 |
| Jira | REST API 연동 | v1 |

### 7.2 Markdown 내보내기 형식

```markdown
# 회의 마인드맵: [회의 제목]

> 요약: [AI 생성 요약]

## 주제 A: 온보딩 개선
- 😟 [김민준 02:15] 신규 온보딩 플로우 이탈률이 40%나 됩니다
- 😊 [김민준 08:00] A/B 테스트로 새 온보딩 플로우를 검증하는 건 어떨까요?

## 액션 아이템
- [ ] A/B 테스트 설계 (담당: 김민준, 기한: 2주 내)
- [ ] 이벤트 트래킹 보강 (담당: 이서연)

## 핵심 결정
- 2주 스프린트로 온보딩 개선 + 트래킹 보강 병행
```

---

## 8. 디자인 시스템 정리

### 8.1 색상 통합 (중복 제거)

현재 emotionConfig가 MindMapNode.tsx, SidePanel.tsx, MindMap.tsx에 산재.
→ `lib/constants.ts`로 통합.

```typescript
// lib/constants.ts
export const EMOTION_CONFIG = {
  positive: { icon: "😊", color: "#10B981", bg: "#ECFDF5", label: "긍정" },
  negative: { icon: "😟", color: "#EF4444", bg: "#FEF2F2", label: "부정" },
  neutral:  { icon: "😐", color: "#9CA3AF", bg: "#F3F4F6", label: "중립" },
  conflict: { icon: "⚡", color: "#F59E0B", bg: "#FFFBEB", label: "갈등" },
} as const;

export const INTENT_CONFIG = {
  proposal:  { icon: "💡", label: "제안" },
  objection: { icon: "🚫", label: "반대" },
  agreement: { icon: "✅", label: "동의" },
  question:  { icon: "❓", label: "질문" },
  info:      { icon: "📋", label: "정보" },
  decision:  { icon: "⚖️", label: "결정" },
} as const;
```

### 8.2 반응형 브레이크포인트

| 브레이크포인트 | 레이아웃 변경 |
|-------------|-------------|
| ≥ 1024px (데스크톱) | 마인드맵 + 사이드패널 좌우 배치 |
| 768~1023px (태블릿) | 사이드패널 → 하단 시트 |
| < 768px (모바일) | 사이드패널 → 풀스크린 오버레이, 필터 → 하단 시트 |

---

## 9. 코드 품질 개선 (즉시)

### 9.1 MindMap.tsx 중복 제거

현재 69~107행과 109~144행이 동일한 노드/엣지 계산을 반복.

**수정 방향:**
```typescript
// 하나의 useMemo로 통합
const { layoutedNodes, layoutedEdges } = useMemo(() => {
  // ... 노드/엣지 계산 1회
  return getLayoutedElements(rawNodes, rawEdges);
}, [filteredUtterances, selectedUtterance, activeNodeIndex, onSelectUtterance]);
```

---

## 10. TODO (구현 순서)

1. [ ] MindMap.tsx 중복 코드 제거
2. [ ] lib/constants.ts 생성 → 감정/의도 상수 통합
3. [ ] TopicNode 컴포넌트 생성
4. [ ] ActionNode 컴포넌트 생성
5. [ ] 계층 구조 레이아웃 반영 (Topic → Utterance 연결)
6. [ ] 노드 텍스트 편집 (더블클릭)
7. [ ] 노드 추가/삭제
8. [ ] PNG 내보내기 구현
9. [ ] Markdown 내보내기 구현
10. [ ] 공유 링크 (URL 해시 방식, MVP)
11. [ ] 모바일 터치 인터랙션
12. [ ] 레이아웃 전환 버튼 (v1)
