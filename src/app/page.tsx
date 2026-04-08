"use client";

import { useState, useCallback, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import MindMap from "@/components/MindMap";
import SidePanel from "@/components/SidePanel";
import AudioPlayer from "@/components/AudioPlayer";
import type { AnalyzedUtterance, AnalysisResult } from "@/lib/types";
import { mockUtterances, mockSummary } from "@/lib/mock-data";

type AppState = "upload" | "processing" | "result";

export default function Home() {
  const [state, setState] = useState<AppState>("upload");
  const [stage, setStage] = useState("");
  const [utterances, setUtterances] = useState<AnalyzedUtterance[]>([]);
  const [summary, setSummary] = useState("");
  const [selectedUtterance, setSelectedUtterance] = useState<AnalyzedUtterance | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [seekMs, setSeekMs] = useState<number | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  // 데모 모드 이벤트 리스너
  useEffect(() => {
    const handler = () => {
      setUtterances(mockUtterances);
      setSummary(mockSummary);
      setState("result");
    };
    window.addEventListener("load-demo", handler);
    return () => window.removeEventListener("load-demo", handler);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setState("processing");
    setAudioUrl(URL.createObjectURL(file));

    try {
      // Phase 1: STT
      setStage("음성을 텍스트로 변환 중... (1/2)");
      const formData = new FormData();
      formData.append("audio", file);

      const sttRes = await fetch("/api/stt", { method: "POST", body: formData });
      const sttData = await sttRes.json();

      if (!sttRes.ok) throw new Error(sttData.error);

      // Phase 2: AI 분석
      setStage("AI가 회의 내용을 분석 중... (2/2)");
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterances: sttData.utterances }),
      });
      const analyzeData: AnalysisResult = await analyzeRes.json();

      if (!analyzeRes.ok) throw new Error((analyzeData as unknown as { error: string }).error);

      setUtterances(analyzeData.utterances);
      setSummary(analyzeData.summary);
      setState("result");
    } catch (error) {
      alert(`처리 중 오류: ${(error as Error).message}`);
      setState("upload");
    }
  }, []);

  const handleExportNotion = useCallback(async () => {
    try {
      const res = await fetch("/api/export-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterances }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`${data.message} (${data.count}개 항목)`);
    } catch (error) {
      alert(`Notion 내보내기 실패: ${(error as Error).message}`);
    }
  }, [utterances]);

  const handleSeek = useCallback((ms: number) => {
    setSeekMs(ms);
    // seekMs를 리셋해서 같은 시간을 다시 클릭해도 동작하게
    setTimeout(() => setSeekMs(null), 100);
  }, []);

  if (state === "upload" || state === "processing") {
    return (
      <div className="h-screen bg-[#F9FAFB] flex items-center justify-center">
        <FileUpload
          onFileSelect={handleFileSelect}
          isProcessing={state === "processing"}
          stage={stage}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 상단 바 */}
      <div className="bg-white border-b border-gray-200 px-5 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">IdeaTracer</h1>
          {summary && <p className="text-xs text-gray-500 mt-0.5">{summary}</p>}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportNotion}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Notion 내보내기
          </button>
          <button
            onClick={() => {
              setState("upload");
              setUtterances([]);
              setSummary("");
              setSelectedUtterance(null);
              setAudioUrl(null);
            }}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            새 회의
          </button>
        </div>
      </div>

      {/* 메인 영역 */}
      <div className="flex flex-1 overflow-hidden">
        <MindMap
          utterances={utterances}
          selectedUtterance={selectedUtterance}
          currentTimeMs={currentTimeMs}
          onSelectUtterance={setSelectedUtterance}
        />
        <SidePanel
          utterance={selectedUtterance}
          onClose={() => setSelectedUtterance(null)}
          onSeek={handleSeek}
        />
      </div>

      {/* 오디오 플레이어 */}
      <AudioPlayer
        audioUrl={audioUrl}
        seekMs={seekMs}
        onTimeUpdate={setCurrentTimeMs}
      />
    </div>
  );
}
