// STT 결과 (Phase 1)
export interface Utterance {
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
}

// AI 분석 결과 (Phase 2)
export type Emotion = "positive" | "negative" | "neutral" | "conflict";
export type Intent = "proposal" | "objection" | "agreement" | "question" | "info";

export interface AnalyzedUtterance extends Utterance {
  index: number;
  emotion: Emotion;
  intent: Intent;
  keyPhrase: string;
  relatedTo: number[];
}

// 마인드맵 노드 데이터 (Phase 3)
export interface MindMapNodeData {
  utterance: AnalyzedUtterance;
}

// 분석 전체 결과
export interface AnalysisResult {
  utterances: AnalyzedUtterance[];
  summary: string;
}
