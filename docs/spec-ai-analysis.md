# AI 분석 파이프라인 스펙

> 마스터플랜 F-02 대응 | 작성일: 2026-04-09

---

## 1. 현재 상태

| 항목 | 구현 | 갭 |
|------|------|-----|
| 감정 분석 | ✅ 4종 (positive/negative/neutral/conflict) | — |
| 의도 분류 | ✅ 5종 (proposal/objection/agreement/question/info) | — |
| 핵심 키워드 | ✅ keyPhrase | 주제 계층화 없음 (플랫 구조) |
| 관계 추출 | ✅ relatedTo 인덱스 | 관계 유형 미분류 |
| 회의 요약 | ✅ summary 1-2문장 | 구조화된 요약 없음 |
| 주제 계층화 | ❌ | 주제→서브주제→세부 구조 없음 |
| 중요도 가중치 | ❌ | 노드별 중요도 없음 |
| 액션아이템 추출 | △ intent=proposal로 간접 | 담당자/기한 미추출 |

---

## 2. 목표 분석 구조

마스터플랜 F-02에 따라, 단순 발언별 태깅에서 **계층적 주제 구조**로 진화해야 함.

### 2.1 현재: 플랫 구조
```
[발언0] ──relatedTo──▶ [발언1]
[발언2] ──relatedTo──▶ [발언0]
```
모든 발언이 동일 레벨. 마인드맵이 얽힌 네트워크가 됨.

### 2.2 목표: 계층 구조
```
[회의 요약]
  ├── [주제 A: 온보딩 개선]
  │     ├── [발언0: 이탈률 40% 문제 제기]
  │     ├── [발언3: A/B 테스트 제안]
  │     └── [액션: 2주 내 A/B 테스트 설계]
  ├── [주제 B: 데이터 트래킹]
  │     ├── [발언2: 수집 기준 재정의 필요]
  │     └── [발언4: 이벤트 트래킹 불완전]
  └── [합의사항]
        └── [발언5: 2주 스프린트로 병행 진행]
```

---

## 3. LLM 프롬프트 전략

### 3.1 2단계 분석 파이프라인

현재 1단계(발언별 태깅)에서, **2단계로 분리**하여 품질과 비용을 최적화.

**Step 1: 주제 추출 + 계층화** (비용 낮은 모델 가능)
```
Input: 전체 발언 텍스트
Output: 주제 트리 + 각 발언의 주제 매핑
```

**Step 2: 발언별 심층 분석** (현재 프롬프트 개선)
```
Input: 주제 트리 + 발언 배열
Output: 감정/의도/키워드/관계/중요도/액션아이템
```

### 3.2 Step 1 프롬프트: 주제 추출

```
당신은 회의 내용 구조화 전문가입니다.

회의 발언 목록을 받아 주제별로 분류하세요.

규칙:
- 최대 7개 주제로 묶기 (너무 잘게 나누지 말 것)
- 각 주제에 명확한 한국어 제목 부여 (5단어 이내)
- 한 발언은 하나의 주제에만 속함
- 발언이 속하지 않는 주제는 만들지 말 것

JSON 형식으로 반환:
{
  "topics": [
    {
      "id": "topic-0",
      "title": "온보딩 개선",
      "utteranceIndices": [0, 3, 5],
      "importance": 0.9
    }
  ]
}
```

### 3.3 Step 2 프롬프트: 발언 분석 (개선안)

```
당신은 회의 맥락 분석 전문가입니다.

아래 주제 구조와 발언 목록을 분석하세요.

각 발언에 대해:
- emotion: "positive" | "negative" | "neutral" | "conflict"
- intent: "proposal" | "objection" | "agreement" | "question" | "info" | "decision"
- keyPhrase: 핵심 키워드 (3-5단어)
- importance: 0.0~1.0 (발언의 회의 내 중요도)
- relatedTo: 의미적으로 연결된 다른 발언 인덱스 배열
- relationType: "supports" | "opposes" | "extends" | "resolves"

액션아이템 추출:
- intent가 "proposal" 또는 "decision"인 발언에서 추출
- assignee: 담당자 (발언에서 추론, 없으면 null)
- deadline: 기한 (발언에서 추론, 없으면 null)

전체 회의 요약을 2-3문장으로 작성.
핵심 결정사항을 별도 리스트로 정리.

JSON 형식:
{
  "utterances": [...],
  "actionItems": [
    { "text": "...", "assignee": "...", "deadline": "...", "sourceIndex": 3 }
  ],
  "decisions": ["..."],
  "summary": "..."
}
```

---

## 4. 타입 정의 (변경 필요)

### 4.1 현재 → 목표

```typescript
// 추가: 주제 타입
interface Topic {
  id: string;
  title: string;
  utteranceIndices: number[];
  importance: number;  // 0~1
}

// 확장: 관계 유형
type RelationType = "supports" | "opposes" | "extends" | "resolves";

interface Relation {
  targetIndex: number;
  type: RelationType;
}

// 확장: AnalyzedUtterance
interface AnalyzedUtterance extends Utterance {
  index: number;
  topicId: string;           // NEW: 소속 주제
  emotion: Emotion;
  intent: Intent;            // "decision" 추가
  keyPhrase: string;
  importance: number;        // NEW: 0~1 중요도
  relatedTo: Relation[];     // CHANGED: number[] → Relation[]
}

// 추가: 액션아이템
interface ActionItem {
  text: string;
  assignee: string | null;
  deadline: string | null;
  sourceIndex: number;
}

// 확장: AnalysisResult
interface AnalysisResult {
  topics: Topic[];           // NEW
  utterances: AnalyzedUtterance[];
  actionItems: ActionItem[]; // NEW
  decisions: string[];       // NEW
  summary: string;
}
```

---

## 5. 모델 선택 전략

| 단계 | 추천 모델 | 이유 | 예상 비용/건 |
|------|----------|------|-------------|
| Step 1 (주제 추출) | GPT-4o-mini | 구조화 작업, 비용 효율 | ~$0.005 |
| Step 2 (심층 분석) | GPT-4o | 감정/의도/관계 정확도 필요 | ~$0.03 |
| **총합** | | | **~$0.035/건** |

### 대안 비교 (v1에서 테스트)

| 모델 | 장점 | 단점 |
|------|------|------|
| GPT-4o | 분석 정확도 높음 | 비용 높음 |
| Claude 3.5 Sonnet | 긴 회의록 처리 우수 (200K 컨텍스트) | 한국어 감정 뉘앙스 약간 약함 |
| GPT-4o-mini | 비용 1/10 | 복잡한 관계 추출 정확도 떨어짐 |

---

## 6. 긴 회의 처리 전략

30분 이상 회의 시 발언 수가 50개 이상 → 토큰 제한 주의.

### 6.1 청크 분할 전략

```
총 발언 수 ≤ 30개: 단일 API 호출
총 발언 수 > 30개: 주제별 청크로 분할
  Step 1 (주제 추출)은 전체에 대해 1회
  Step 2 (심층 분석)는 주제별로 분할 호출
  → 주제 간 관계는 마지막에 별도 호출로 연결
```

### 6.2 비용 상한

- 건당 API 비용 상한: $0.10
- 상한 초과 시: GPT-4o-mini로 폴백 + 사용자 알림

---

## 7. 에러/엣지 케이스

| 상황 | 대응 |
|------|------|
| LLM이 잘못된 JSON 반환 | 최대 2회 재시도, 실패 시 기본값 적용 |
| relatedTo에 존재하지 않는 인덱스 | 필터링 후 무시 |
| 발언이 3개 미만 | 주제 추출 생략, 단일 주제로 처리 |
| 60분 이상 회의 (발언 100+) | 청크 분할 + 병렬 처리 |
| LLM 환각 (없는 내용 생성) | 원문 타임스탬프 항상 병기, 사용자 편집 허용 |

---

## 8. TODO (구현 순서)

1. [ ] types.ts에 Topic, ActionItem, Relation 타입 추가
2. [ ] Step 1 프롬프트 (주제 추출) 구현 및 테스트
3. [ ] Step 2 프롬프트 개선 (importance, relationType 추가)
4. [ ] 2단계 파이프라인으로 /api/analyze 리팩토링
5. [ ] 청크 분할 로직 구현 (30발언 이상)
6. [ ] 액션아이템 추출 + actionItems 응답 추가
7. [ ] 비용 추적 로직 (건당 토큰/비용 로깅)
8. [ ] GPT-4o vs Claude 3.5 Sonnet 품질 비교 테스트
