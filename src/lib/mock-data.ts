import type { AnalyzedUtterance, AnalysisResult, Topic, ActionItem } from "./types";

const mockTopics: Topic[] = [
  {
    id: "topic-0",
    title: "온보딩 개선",
    utteranceIndices: [0, 1, 3],
    importance: 0.9,
  },
  {
    id: "topic-1",
    title: "데이터 트래킹",
    utteranceIndices: [2, 4],
    importance: 0.7,
  },
  {
    id: "topic-2",
    title: "스프린트 합의",
    utteranceIndices: [5],
    importance: 0.8,
  },
];

const mockUtterances: AnalyzedUtterance[] = [
  {
    index: 0,
    speaker: "김민준",
    text: "신규 온보딩 플로우를 전면 개선해야 합니다. 이탈률이 40%나 됩니다.",
    startMs: 15000,
    endMs: 22000,
    topicId: "topic-0",
    emotion: "negative",
    intent: "proposal",
    keyPhrase: "온보딩 이탈률 개선",
    importance: 0.9,
    relatedTo: [
      { targetIndex: 1, type: "extends" },
      { targetIndex: 3, type: "extends" },
    ],
  },
  {
    index: 1,
    speaker: "이서연",
    text: "기존 사용자 리텐션은 양호한 편이에요. 7일 리텐션 68%입니다.",
    startMs: 25000,
    endMs: 31000,
    topicId: "topic-0",
    emotion: "positive",
    intent: "info",
    keyPhrase: "리텐션 양호",
    importance: 0.5,
    relatedTo: [{ targetIndex: 0, type: "supports" }],
  },
  {
    index: 2,
    speaker: "박도현",
    text: "데이터 수집 기준을 먼저 재정의해야 정확한 판단이 가능합니다.",
    startMs: 35000,
    endMs: 42000,
    topicId: "topic-1",
    emotion: "neutral",
    intent: "objection",
    keyPhrase: "데이터 기준 재정의",
    importance: 0.7,
    relatedTo: [
      { targetIndex: 0, type: "opposes" },
      { targetIndex: 4, type: "extends" },
    ],
  },
  {
    index: 3,
    speaker: "김민준",
    text: "A/B 테스트로 새 온보딩 플로우를 검증하는 건 어떨까요?",
    startMs: 48000,
    endMs: 54000,
    topicId: "topic-0",
    emotion: "positive",
    intent: "proposal",
    keyPhrase: "A/B 테스트 제안",
    importance: 0.85,
    relatedTo: [
      { targetIndex: 0, type: "resolves" },
      { targetIndex: 5, type: "extends" },
    ],
  },
  {
    index: 4,
    speaker: "이서연",
    text: "현재 이벤트 트래킹이 불완전해서 퍼널 분석이 어렵습니다.",
    startMs: 58000,
    endMs: 65000,
    topicId: "topic-1",
    emotion: "negative",
    intent: "objection",
    keyPhrase: "트래킹 불완전",
    importance: 0.6,
    relatedTo: [{ targetIndex: 2, type: "supports" }],
  },
  {
    index: 5,
    speaker: "박도현",
    text: "좋습니다. 2주 스프린트로 온보딩 개선 + 트래킹 보강을 병행하죠.",
    startMs: 70000,
    endMs: 78000,
    topicId: "topic-2",
    emotion: "positive",
    intent: "decision",
    keyPhrase: "2주 스프린트 합의",
    importance: 0.95,
    relatedTo: [
      { targetIndex: 3, type: "resolves" },
      { targetIndex: 4, type: "resolves" },
    ],
  },
];

const mockActionItems: ActionItem[] = [
  {
    text: "신규 온보딩 플로우 A/B 테스트 설계",
    assignee: "김민준",
    deadline: "2주 내",
    sourceIndex: 3,
  },
  {
    text: "이벤트 트래킹 보강 및 데이터 수집 기준 재정의",
    assignee: "이서연",
    deadline: "2주 내",
    sourceIndex: 2,
  },
];

const mockDecisions: string[] = [
  "2주 스프린트로 온보딩 개선과 트래킹 보강을 병행 진행",
];

export const mockResult: AnalysisResult = {
  topics: mockTopics,
  utterances: mockUtterances,
  actionItems: mockActionItems,
  decisions: mockDecisions,
  summary:
    "온보딩 이탈률 40% 문제를 해결하기 위해 A/B 테스트 기반 개선과 이벤트 트래킹 보강을 2주 스프린트로 진행하기로 합의.",
};
