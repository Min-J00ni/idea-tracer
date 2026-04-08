"use client";

import type { Emotion } from "@/lib/types";

const emotions: { key: Emotion; label: string; color: string; icon: string }[] = [
  { key: "positive", label: "긍정", color: "#10B981", icon: "😊" },
  { key: "negative", label: "부정", color: "#EF4444", icon: "😟" },
  { key: "neutral", label: "중립", color: "#9CA3AF", icon: "😐" },
  { key: "conflict", label: "갈등", color: "#F59E0B", icon: "⚡" },
];

interface Props {
  activeFilters: Set<Emotion>;
  onToggle: (emotion: Emotion) => void;
}

export default function EmotionFilter({ activeFilters, onToggle }: Props) {
  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      {emotions.map((e) => (
        <button
          key={e.key}
          onClick={() => onToggle(e.key)}
          className={`
            text-xs px-2.5 py-1.5 rounded-full border transition-all
            ${
              activeFilters.has(e.key)
                ? "bg-white shadow-sm"
                : "bg-gray-100 opacity-50"
            }
          `}
          style={{
            borderColor: activeFilters.has(e.key) ? e.color : "transparent",
          }}
        >
          {e.icon} {e.label}
        </button>
      ))}
    </div>
  );
}
