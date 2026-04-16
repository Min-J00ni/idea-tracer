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

  const borderWidth = utterance.importance >= 0.8 ? 3 : utterance.importance >= 0.5 ? 2 : 1;

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
      className={`
        bg-white rounded-xl shadow-sm px-4 py-3 min-w-[240px] max-w-[280px]
        cursor-pointer transition-all duration-200
        ${isHighlighted ? "ring-2 ring-blue-400 scale-105" : ""}
        ${isEditing ? "cursor-text" : ""}
      `}
      style={{
        borderWidth: `${borderWidth}px`,
        borderStyle: "solid",
        borderColor: isEditing ? "#3B82F6" : isHighlighted ? "#60A5FA" : emotion.color + "40",
      }}
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

      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className="w-full text-sm text-gray-800 font-medium leading-snug resize-none border-none outline-none bg-transparent mb-2"
          rows={3}
        />
      ) : (
        <p className="text-sm text-gray-800 font-medium leading-snug mb-2 line-clamp-2">
          {utterance.text}
        </p>
      )}

      <div className="flex items-center justify-between">
        <span className="text-[10px] text-gray-400">
          {formatMs(utterance.startMs)}
        </span>
        <span className="text-[10px] px-1.5 py-0.5 bg-gray-50 rounded text-gray-500">
          {intent.icon} {intent.label}
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
