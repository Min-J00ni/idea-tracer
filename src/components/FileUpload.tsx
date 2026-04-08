"use client";

import { useCallback, useState } from "react";

interface Props {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
  stage: string;
}

export default function FileUpload({ onFileSelect, isProcessing, stage }: Props) {
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">IdeaTracer</h1>
        <p className="text-gray-500">회의 녹음을 마인드맵으로 시각화합니다</p>
      </div>

      {isProcessing ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
          <p className="text-sm text-gray-600">{stage}</p>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`
            w-full max-w-md border-2 border-dashed rounded-2xl p-12 text-center
            transition-colors cursor-pointer
            ${dragOver ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
          `}
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
            <p className="text-sm font-medium text-gray-700 mb-1">
              오디오 파일을 드래그하거나 클릭하세요
            </p>
            <p className="text-xs text-gray-400">MP3, WAV, M4A 지원</p>
          </label>
        </div>
      )}

      <button
        onClick={() => {
          // 데모 모드: mock data 사용
          const event = new CustomEvent("load-demo");
          window.dispatchEvent(event);
        }}
        className="text-sm text-blue-500 hover:text-blue-700 underline underline-offset-2"
      >
        데모 데이터로 체험하기
      </button>
    </div>
  );
}
