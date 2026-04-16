// STT 결과
export interface Utterance {
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
}

// STT 메타데이터
export interface STTMetadata {
  duration: number;
  language: string;
  speakerCount: number;
  engine: string;
  confidence: number;
}

// 감정 / 의도
export type Emotion = "positive" | "negative" | "neutral" | "conflict";
export type Intent =
  | "proposal"
  | "objection"
  | "agreement"
  | "question"
  | "info"
  | "decision";

// 관계 유형
export type RelationType = "supports" | "opposes" | "extends" | "resolves";

export interface Relation {
  targetIndex: number;
  type: RelationType;
}

// 주제 그룹
export interface Topic {
  id: string;
  title: string;
  utteranceIndices: number[];
  importance: number; // 0~1
}

// AI 분석된 발언
export interface AnalyzedUtterance extends Utterance {
  index: number;
  topicId: string;
  emotion: Emotion;
  intent: Intent;
  keyPhrase: string;
  importance: number; // 0~1
  relatedTo: Relation[];
}

// 액션아이템
export interface ActionItem {
  text: string;
  assignee: string | null;
  deadline: string | null;
  sourceIndex: number;
}

// 분석 전체 결과
export interface AnalysisResult {
  topics: Topic[];
  utterances: AnalyzedUtterance[];
  actionItems: ActionItem[];
  decisions: string[];
  summary: string;
}
