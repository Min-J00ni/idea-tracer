"use client";

import { useState, useRef, useCallback } from "react";
import { Handle, Position } from "reactflow";
import type { AnalyzedUtterance } from "@/lib/types";
import { EMOTION_CONFIG, INTENT_CONFIG } from "@/lib/constants";

interface Props {
  data: {
    utterance: AnalyzedUtterance;
    isHighlighted: boolean;
    onClick: (utterance: AnalyzedUtterance) => void;
    onUpdateText?: (index: number, text: string) => void;
  };
}

export default function MindMapNode({ data }: Props) {
  const { utterance, isHighlighted, onClick, onUpdateText } = data;
  const emotion = EMOTION_CONFIG[utterance.emotion];
  const intent = INTENT_CONFIG[utterance.intent];
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(utterance.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const borderWidth = utterance.importance >= 0.8 ? 2 : 1;
  const borderColor = isEditing
    ? "rgba(113,112,255,0.6)"
    : isHighlighted
    ? "rgba(113,112,255,0.5)"
    : `${emotion.color}33`;

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onUpdateText) return;
      e.stopPropagation();
      setIsEditing(true);
      setTimeout(() => textareaRef.current?.focus(), 0);
    },
    [onUpdateText]
  );

  const handleSave = useCallback(() => {
    setIsEditing(false);
    if (editText.trim() && editText !== utterance.text) {
      onUpdateText?.(utterance.index, editText.trim());
    } else {
      setEditText(utterance.text);
    }
  }, [editText, utterance.text, utterance.index, onUpdateText]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape") {
        setEditText(utterance.text);
        setIsEditing(false);
      }
    },
    [handleSave, utterance.text]
  );

  return (
    <div
      onClick={() => !isEditing && onClick(utterance)}
      onDoubleClick={handleDoubleClick}
      style={{
        background: isHighlighted
          ? "rgba(255,255,255,0.05)"
          : "rgba(255,255,255,0.03)",
        border: `${borderWidth}px solid ${borderColor}`,
        borderRadius: "10px",
        padding: "12px 14px",
        minWidth: "240px",
        maxWidth: "280px",
        cursor: isEditing ? "text" : "pointer",
        transition: "all 0.15s",
        boxShadow: isHighlighted
          ? "0 0 0 3px rgba(113,112,255,0.15)"
          : "rgba(0,0,0,0.2) 0px 0px 0px 1px",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "rgba(255,255,255,0.15)", width: 6, height: 6 }}
      />

      {/* 상단: 화자 + 감정 배지 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "6px",
        }}
      >
        <span
          style={{ fontSize: "11px", fontWeight: 590, color: "#8a8f98", letterSpacing: "-0.13px" }}
        >
          {utterance.speaker}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 510,
            padding: "2px 6px",
            borderRadius: "9999px",
            background: `${emotion.color}20`,
            color: emotion.color,
          }}
        >
          {emotion.icon} {emotion.label}
        </span>
      </div>

      {/* 본문 */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          style={{
            width: "100%",
            fontSize: "13px",
            fontWeight: 400,
            color: "#d0d6e0",
            lineHeight: 1.5,
            resize: "none",
            border: "none",
            outline: "none",
            background: "transparent",
            marginBottom: "8px",
            fontFamily: "inherit",
            fontFeatureSettings: '"cv01", "ss03"',
          }}
          rows={3}
        />
      ) : (
        <p
          style={{
            fontSize: "13px",
            fontWeight: 400,
            color: "#d0d6e0",
            lineHeight: 1.5,
            marginBottom: "8px",
            overflow: "hidden",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
          }}
        >
          {utterance.text}
        </p>
      )}

      {/* 하단: 타임스탬프 + 의도 + 키워드 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: "10px", color: "#62666d" }}>
          {formatMs(utterance.startMs)}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 510,
            padding: "1px 6px",
            borderRadius: "4px",
            background: "rgba(255,255,255,0.04)",
            color: "#8a8f98",
            border: "1px solid rgba(255,255,255,0.05)",
          }}
        >
          {intent.icon} {intent.label}
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 590,
            color: emotion.color,
          }}
        >
          {utterance.keyPhrase}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "rgba(255,255,255,0.15)", width: 6, height: 6 }}
      />
    </div>
  );
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
