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
    <div className="w-80 bg-white border-l border-gray-200 p-5 overflow-y-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">발언 상세</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">
          ✕
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: emotion.color }}
        />
        <span className="text-sm font-medium text-gray-700">{utterance.speaker}</span>
        <button
          onClick={() => onSeek(utterance.startMs)}
          className="ml-auto text-xs text-blue-500 hover:text-blue-700 cursor-pointer"
        >
          {formatMs(utterance.startMs)} 재생
        </button>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 rounded-lg p-3">
        {utterance.text}
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded p-2">
          <span className="text-gray-500">감정</span>
          <p className="font-medium mt-0.5" style={{ color: emotion.color }}>
            {emotion.icon} {emotion.label}
          </p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <span className="text-gray-500">의도</span>
          <p className="font-medium mt-0.5 text-gray-800">
            {intent.icon} {intent.label}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-gray-50 rounded p-2">
          <span className="text-gray-500">핵심 키워드</span>
          <p className="text-sm font-medium mt-0.5 text-gray-800">{utterance.keyPhrase}</p>
        </div>
        <div className="bg-gray-50 rounded p-2">
          <span className="text-gray-500">중요도</span>
          <div className="flex items-center gap-1 mt-0.5">
            <div className="flex-1 h-1.5 bg-gray-200 rounded-full">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${utterance.importance * 100}%`,
                  backgroundColor: emotion.color,
                }}
              />
            </div>
            <span className="text-gray-600 font-medium">
              {Math.round(utterance.importance * 100)}%
            </span>
          </div>
        </div>
      </div>

      {utterance.relatedTo.length > 0 && (
        <div className="text-xs text-gray-500">
          <span className="text-gray-400">연결:</span>{" "}
          {utterance.relatedTo.map((r) => `#${r.targetIndex}(${r.type})`).join(", ")}
        </div>
      )}
    </div>
  );
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
