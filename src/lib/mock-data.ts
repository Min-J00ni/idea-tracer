import type { AnalyzedUtterance } from "./types";

// API 키 없이도 테스트할 수 있는 샘플 데이터
export const mockUtterances: AnalyzedUtterance[] = [
  {
    index: 0,
    speaker: "김민준",
    text: "신규 온보딩 플로우를 전면 개선해야 합니다. 이탈률이 40%나 됩니다.",
    startMs: 15000,
    endMs: 22000,
    emotion: "negative",
    intent: "proposal",
    keyPhrase: "온보딩 이탈률 개선",
    relatedTo: [1, 3],
  },
  {
    index: 1,
    speaker: "이서연",
    text: "기존 사용자 리텐션은 양호한 편이에요. 7일 리텐션 68%입니다.",
    startMs: 25000,
    endMs: 31000,
    emotion: "positive",
    intent: "info",
    keyPhrase: "리텐션 양호",
    relatedTo: [0],
  },
  {
    index: 2,
    speaker: "박도현",
    text: "데이터 수집 기준을 먼저 재정의해야 정확한 판단이 가능합니다.",
    startMs: 35000,
    endMs: 42000,
    emotion: "neutral",
    intent: "objection",
    keyPhrase: "데이터 기준 재정의",
    relatedTo: [0, 4],
  },
  {
    index: 3,
    speaker: "김민준",
    text: "A/B 테스트로 새 온보딩 플로우를 검증하는 건 어떨까요?",
    startMs: 48000,
    endMs: 54000,
    emotion: "positive",
    intent: "proposal",
    keyPhrase: "A/B 테스트 제안",
    relatedTo: [0, 5],
  },
  {
    index: 4,
    speaker: "이서연",
    text: "현재 이벤트 트래킹이 불완전해서 퍼널 분석이 어렵습니다.",
    startMs: 58000,
    endMs: 65000,
    emotion: "negative",
    intent: "objection",
    keyPhrase: "트래킹 불완전",
    relatedTo: [2],
  },
  {
    index: 5,
    speaker: "박도현",
    text: "좋습니다. 2주 스프린트로 온보딩 개선 + 트래킹 보강을 병행하죠.",
    startMs: 70000,
    endMs: 78000,
    emotion: "positive",
    intent: "agreement",
    keyPhrase: "2주 스프린트 합의",
    relatedTo: [3, 4],
  },
];

export const mockSummary =
  "온보딩 이탈률 40% 문제를 해결하기 위해 A/B 테스트 기반 개선과 이벤트 트래킹 보강을 2주 스프린트로 진행하기로 합의.";
