"use client";

import { useCallback, useState } from "react";

interface Props {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  stage: string;
}

export default function FileUpload({ onFileSelect, isProcessing, stage }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const MAX_SIZE_MB = 50;

  const validateAndSelect = useCallback(
    (file: File) => {
      if (!file.type.startsWith("audio/") && !file.type.startsWith("video/")) {
        alert("오디오 파일만 업로드할 수 있습니다. (MP3, WAV, M4A, WebM, OGG)");
        return;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        alert(`파일 크기가 너무 큽니다. 최대 ${MAX_SIZE_MB} MB까지 지원합니다.`);
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndSelect(file);
    },
    [validateAndSelect]
  );

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="text-center mb-4">
        <h1
          className="text-3xl mb-2"
          style={{
            fontWeight: 510,
            color: "#f7f8f8",
            letterSpacing: "-0.704px",
          }}
        >
          IdeaTracer
        </h1>
        <p style={{ color: "#8a8f98", fontSize: "15px" }}>
          회의 녹음을 마인드맵으로 시각화합니다
        </p>
      </div>

      {isProcessing ? (
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full animate-spin"
            style={{
              border: "2px solid rgba(255,255,255,0.08)",
              borderTopColor: "#7170ff",
            }}
          />
          <p style={{ fontSize: "13px", color: "#8a8f98" }}>{stage}</p>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className="w-full max-w-md rounded-2xl p-12 text-center transition-all cursor-pointer"
          style={{
            border: `2px dashed ${dragOver ? "#7170ff" : "rgba(255,255,255,0.08)"}`,
            background: dragOver
              ? "rgba(113,112,255,0.06)"
              : "rgba(255,255,255,0.02)",
          }}
        >
          <input
            type="file"
            accept="audio/*"
            onChange={handleChange}
            className="hidden"
            id="audio-upload"
          />
          <label htmlFor="audio-upload" className="cursor-pointer">
            <div className="text-4xl mb-3">🎙️</div>
            <p
              className="mb-1"
              style={{ fontSize: "14px", fontWeight: 510, color: "#d0d6e0" }}
            >
              오디오 파일을 드래그하거나 클릭하세요
            </p>
            <p style={{ fontSize: "12px", color: "#62666d" }}>
              MP3, WAV, M4A 지원
            </p>
          </label>
        </div>
      )}

      <button
        onClick={() => window.dispatchEvent(new CustomEvent("load-demo"))}
        style={{
          fontSize: "13px",
          color: "#7170ff",
          background: "none",
          border: "none",
          cursor: "pointer",
          textDecoration: "underline",
          textUnderlineOffset: "3px",
        }}
        onMouseOver={(e) =>
          ((e.target as HTMLElement).style.color = "#828fff")
        }
        onMouseOut={(e) =>
          ((e.target as HTMLElement).style.color = "#7170ff")
        }
      >
        데모 데이터로 체험하기
      </button>
    </div>
  );
}
