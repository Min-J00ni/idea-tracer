"use client";

import type { Emotion } from "@/lib/types";

const emotions: { key: Emotion; label: string; color: string; icon: string }[] = [
  { key: "positive", label: "긍정", color: "#10B981", icon: "😊" },
  { key: "negative", label: "부정", color: "#EF4444", icon: "😟" },
  { key: "neutral",  label: "중립", color: "#9CA3AF", icon: "😐" },
  { key: "conflict", label: "갈등", color: "#F59E0B", icon: "⚡" },
];

interface Props {
  activeFilters: Set<Emotion>;
  onToggle: (emotion: Emotion) => void;
}

export default function EmotionFilter({ activeFilters, onToggle }: Props) {
  return (
    <div className="absolute top-4 left-4 z-10 flex gap-2">
      {emotions.map((e) => {
        const active = activeFilters.has(e.key);
        return (
          <button
            key={e.key}
            onClick={() => onToggle(e.key)}
            style={{
              fontSize: "12px",
              fontWeight: 510,
              padding: "4px 10px 4px 6px",
              borderRadius: "9999px",
              border: `1px solid ${active ? e.color : "rgba(255,255,255,0.08)"}`,
              background: active ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
              color: active ? "#d0d6e0" : "#62666d",
              cursor: "pointer",
              transition: "all 0.15s",
              opacity: active ? 1 : 0.6,
            }}
          >
            {e.icon} {e.label}
          </button>
        );
      })}
    </div>
  );
}
