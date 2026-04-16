"use client";

import type { AnalyzedUtterance } from "@/lib/types";
import { EMOTION_CONFIG, INTENT_CONFIG } from "@/lib/constants";

interface Props {
  utterance: AnalyzedUtterance | null;
  onClose: () => void;
  onSeek: (ms: number) => void;
}

export default function SidePanel({ utterance, onClose, onSeek }: Props) {
  if (!utterance) return null;

  const emotion = EMOTION_CONFIG[utterance.emotion];
  const intent = INTENT_CONFIG[utterance.intent];

  return (
    <div
      style={{
        width: "300px",
        background: "#0f1011",
        borderLeft: "1px solid rgba(255,255,255,0.08)",
        padding: "20px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
      }}
    >
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span
          style={{ fontSize: "13px", fontWeight: 590, color: "#f7f8f8", letterSpacing: "-0.13px" }}
        >
          발언 상세
        </span>
        <button
          onClick={onClose}
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px",
            color: "#8a8f98",
            fontSize: "12px",
            width: "24px",
            height: "24px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>
      </div>

      {/* 화자 + 재생 */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: emotion.color,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: "13px", fontWeight: 510, color: "#d0d6e0" }}>
          {utterance.speaker}
        </span>
        <button
          onClick={() => onSeek(utterance.startMs)}
          style={{
            marginLeft: "auto",
            fontSize: "11px",
            fontWeight: 510,
            color: "#7170ff",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {formatMs(utterance.startMs)} 재생
        </button>
      </div>

      {/* 본문 */}
      <p
        style={{
          fontSize: "13px",
          color: "#d0d6e0",
          lineHeight: 1.6,
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: "8px",
          padding: "12px",
          margin: 0,
        }}
      >
        {utterance.text}
      </p>

      {/* 감정 + 의도 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <MetaBox label="감정">
          <span style={{ fontWeight: 510, color: emotion.color }}>
            {emotion.icon} {emotion.label}
          </span>
        </MetaBox>
        <MetaBox label="의도">
          <span style={{ fontWeight: 510, color: "#d0d6e0" }}>
            {intent.icon} {intent.label}
          </span>
        </MetaBox>
      </div>

      {/* 키워드 + 중요도 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
        <MetaBox label="핵심 키워드">
          <span style={{ fontSize: "13px", fontWeight: 510, color: "#d0d6e0" }}>
            {utterance.keyPhrase}
          </span>
        </MetaBox>
        <MetaBox label="중요도">
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                flex: 1,
                height: "4px",
                background: "rgba(255,255,255,0.08)",
                borderRadius: "9999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${utterance.importance * 100}%`,
                  height: "100%",
                  background: emotion.color,
                  borderRadius: "9999px",
                }}
              />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 510, color: "#8a8f98" }}>
              {Math.round(utterance.importance * 100)}%
            </span>
          </div>
        </MetaBox>
      </div>

      {utterance.relatedTo.length > 0 && (
        <p style={{ fontSize: "11px", color: "#62666d", margin: 0 }}>
          연결:{" "}
          {utterance.relatedTo.map((r) => `#${r.targetIndex}(${r.type})`).join(", ")}
        </p>
      )}
    </div>
  );
}

function MetaBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: "8px",
        padding: "8px 10px",
      }}
    >
      <span style={{ fontSize: "10px", fontWeight: 510, color: "#62666d", display: "block", marginBottom: "4px" }}>
        {label}
      </span>
      <div style={{ fontSize: "12px" }}>{children}</div>
    </div>
  );
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
