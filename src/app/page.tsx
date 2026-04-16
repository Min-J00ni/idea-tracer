"use client";

import { useState, useCallback, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import MindMap from "@/components/MindMap";
import SidePanel from "@/components/SidePanel";
import AudioPlayer from "@/components/AudioPlayer";
import type { AnalyzedUtterance, AnalysisResult } from "@/lib/types";
import { mockResult } from "@/lib/mock-data";
import { toMarkdown, downloadText, encodeShareData, decodeShareData } from "@/lib/export";
import ErrorBoundary from "@/components/ErrorBoundary";

type AppState = "upload" | "processing" | "result";

const emptyResult: AnalysisResult = {
  topics: [],
  utterances: [],
  actionItems: [],
  decisions: [],
  summary: "",
};

export default function Home() {
  const [state, setState] = useState<AppState>("upload");
  const [stage, setStage] = useState("");
  const [result, setResult] = useState<AnalysisResult>(emptyResult);
  const [selectedUtterance, setSelectedUtterance] = useState<AnalyzedUtterance | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [seekMs, setSeekMs] = useState<number | null>(null);
  const [currentTimeMs, setCurrentTimeMs] = useState(0);

  // 데모 모드 + 공유 링크 로드
  useEffect(() => {
    const handler = () => {
      setResult(mockResult);
      setState("result");
    };
    window.addEventListener("load-demo", handler);

    // URL 해시에 공유 데이터가 있으면 로드
    const hash = window.location.hash;
    if (hash.startsWith("#share=")) {
      const decoded = decodeShareData(hash.slice(7));
      if (decoded) {
        setResult(decoded);
        setState("result");
      }
    }

    return () => window.removeEventListener("load-demo", handler);
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    setState("processing");
    setAudioUrl(URL.createObjectURL(file));

    try {
      setStage("음성을 텍스트로 변환 중... (1/2)");
      const formData = new FormData();
      formData.append("audio", file);

      const sttRes = await fetch("/api/stt", { method: "POST", body: formData });
      const sttData = await sttRes.json();
      if (!sttRes.ok) throw new Error(sttData.error);

      setStage("AI가 회의 내용을 분석 중... (2/2)");
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterances: sttData.utterances }),
      });
      const analyzeData = await analyzeRes.json();
      if (!analyzeRes.ok) throw new Error(analyzeData.error);

      setResult(analyzeData);
      setState("result");
    } catch (error) {
      alert(`처리 중 오류: ${(error as Error).message}`);
      setState("upload");
    }
  }, []);

  const handleUpdateUtterance = useCallback((index: number, text: string) => {
    setResult((prev) => ({
      ...prev,
      utterances: prev.utterances.map((u) =>
        u.index === index ? { ...u, text } : u
      ),
    }));
  }, []);

  const handleExportNotion = useCallback(async () => {
    try {
      const res = await fetch("/api/export-notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ utterances: result.utterances }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      alert(`${data.message} (${data.count}개 항목)`);
    } catch (error) {
      alert(`Notion 내보내기 실패: ${(error as Error).message}`);
    }
  }, [result.utterances]);

  const handleExportMarkdown = useCallback(() => {
    const md = toMarkdown(result);
    downloadText(md, "mindmap.md", "text/markdown");
  }, [result]);

  const handleShare = useCallback(() => {
    const encoded = encodeShareData(result);
    const url = `${window.location.origin}${window.location.pathname}#share=${encoded}`;
    navigator.clipboard.writeText(url).then(
      () => alert("공유 링크가 클립보드에 복사되었습니다."),
      () => prompt("아래 링크를 복사하세요:", url)
    );
  }, [result]);

  const handleSeek = useCallback((ms: number) => {
    setSeekMs(ms);
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
          {result.summary && (
            <p className="text-xs text-gray-500 mt-0.5">{result.summary}</p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            공유 링크
          </button>
          <button
            onClick={handleExportMarkdown}
            className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            MD 내보내기
          </button>
          <button
            onClick={handleExportNotion}
            className="text-xs px-3 py-1.5 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Notion 내보내기
          </button>
          <button
            onClick={() => {
              setState("upload");
              setResult(emptyResult);
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
        <ErrorBoundary>
          <MindMap
            result={result}
            selectedUtterance={selectedUtterance}
            currentTimeMs={currentTimeMs}
            onSelectUtterance={setSelectedUtterance}
            onUpdateUtterance={handleUpdateUtterance}
          />
        </ErrorBoundary>
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
