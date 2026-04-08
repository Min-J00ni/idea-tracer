"use client";

import { Handle, Position } from "reactflow";
import type { AnalyzedUtterance, Emotion } from "@/lib/types";

const emotionConfig: Record<Emotion, { icon: string; color: string; bg: string; label: string }> = {
  positive: { icon: "😊", color: "#10B981", bg: "#ECFDF5", label: "긍정" },
  negative: { icon: "😟", color: "#EF4444", bg: "#FEF2F2", label: "부정" },
  neutral: { icon: "😐", color: "#9CA3AF", bg: "#F3F4F6", label: "중립" },
  conflict: { icon: "⚡", color: "#F59E0B", bg: "#FFFBEB", label: "갈등" },
};

const intentBadge: Record<string, string> = {
  proposal: "💡 제안",
  objection: "🚫 반대",
  agreement: "✅ 동의",
  question: "❓ 질문",
  info: "📋 정보",
};

interface Props {
  data: {
    utterance: AnalyzedUtterance;
    isHighlighted: boolean;
    onClick: (utterance: AnalyzedUtterance) => void;
  };
}

export default function MindMapNode({ data }: Props) {
  const { utterance, isHighlighted, onClick } = data;
  const emotion = emotionConfig[utterance.emotion];

  return (
    <div
      onClick={() => onClick(utterance)}
      className={`
        bg-white rounded-xl shadow-sm border-2 px-4 py-3 min-w-[240px] max-w-[280px]
        cursor-pointer transition-all duration-200
        ${isHighlighted ? "ring-2 ring-blue-400 scale-105" : ""}
      `}
      style={{ borderColor: isHighlighted ? "#60A5FA" : emotion.color + "40" }}
    >
      <Handle type="target" position={Position.Left} className="!bg-gray-300 !w-2 !h-2" />

      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-semibold text-gray-700">{utterance.speaker}</span>
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
          style={{ backgroundColor: emotion.bg, color: emotion.color }}
        >
          {emotion.icon} {emotion.label}
        </span>
      </div>

      <p className="text-sm text-gray-800 font-medium leading-snug mb-2 line-clamp-2">
        {utterance.text}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {formatMs(utterance.startMs)}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 rounded text-gray-500">
          {intentBadge[utterance.intent] || utterance.intent}
        </span>
        <span
          className="text-[10px] font-bold"
          style={{ color: emotion.color }}
        >
          {utterance.keyPhrase}
        </span>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-gray-300 !w-2 !h-2" />
    </div>
  );
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
