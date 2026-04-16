import type { Emotion, Intent } from "./types";

export const EMOTION_CONFIG: Record<
  Emotion,
  { icon: string; color: string; bg: string; label: string }
> = {
  positive: { icon: "😊", color: "#10B981", bg: "#ECFDF5", label: "긍정" },
  negative: { icon: "😟", color: "#EF4444", bg: "#FEF2F2", label: "부정" },
  neutral: { icon: "😐", color: "#9CA3AF", bg: "#F3F4F6", label: "중립" },
  conflict: { icon: "⚡", color: "#F59E0B", bg: "#FFFBEB", label: "갈등" },
} as const;

export const INTENT_CONFIG: Record<
  Intent,
  { icon: string; label: string }
> = {
  proposal: { icon: "💡", label: "제안" },
  objection: { icon: "🚫", label: "반대" },
  agreement: { icon: "✅", label: "동의" },
  question: { icon: "❓", label: "질문" },
  info: { icon: "📋", label: "정보" },
  decision: { icon: "⚖️", label: "결정" },
} as const;

export const EDGE_COLORS: Record<Emotion, string> = {
  positive: "#10B981",
  negative: "#EF4444",
  neutral: "#D1D5DB",
  conflict: "#F59E0B",
} as const;
