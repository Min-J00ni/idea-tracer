"use client";

import { useState, useCallback, useEffect } from "react";
import FileUpload from "@/components/FileUpload";
import MindMap from "@/components/MindMap";
import SidePanel from "@/components/SidePanel";
import AudioPlayer from "@/components/AudioPlayer";
import ThemeToggle from "@/components/ThemeToggle";
import type { AnalyzedUtterance, AnalysisResult, Point } from "@/lib/types";
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
  const [selectedPoint, setSelectedPoint] = useState<Point | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
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
        body: JSON.stringify({
          result,
          meetingTitle: result.summary
            ? result.summary.slice(0, 100)
            : `회의 노트 ${new Date().toLocaleDateString("ko-KR")}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const msg = data.pageUrl
        ? `Notion 페이지가 생성됐습니다.\n${data.pageUrl}`
        : data.message;
      alert(msg);
    } catch (error) {
      alert(`Notion 내보내기 실패: ${(error as Error).message}`);
    }
  }, [result]);

  const handleExportMarkdown = useCallback(() => {
    const md = toMarkdown(result);
    downloadText(md, "mindmap.md", "text/markdown");
  }, [result]);

  const handleShare = useCallback(() => {
    const confirmed = window.confirm(
      "공유 링크에는 회의 전체 내용(발언·요약·액션아이템)이 포함됩니다.\n" +
        "링크를 받은 사람은 누구나 내용을 볼 수 있습니다.\n\n" +
        "계속하시겠습니까?"
    );
    if (!confirmed) return;

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

  const handleSelectPoint = useCallback((point: Point) => {
    // 사이드패널에 point 전체를 넘겨서 모든 관련 발언을 표시
    setSelectedPoint(point);
    setSelectedUtterance(null);
    setSidePanelOpen(true);
    // 오디오는 첫 번째 발언 시점으로 이동
    const firstIndex = point.supportingUtterances[0];
    if (firstIndex !== undefined) {
      const utterance = result.utterances.find((u) => u.index === firstIndex);
      if (utterance) handleSeek(utterance.startMs);
    }
  }, [result.utterances, handleSeek]);

  const handleTopicMarkerClick = useCallback((_topicId: string, ms: number) => {
    setSeekMs(ms);
    setTimeout(() => setSeekMs(null), 100);
    setSidePanelOpen(true);
  }, []);

  const handleCloseSidePanel = useCallback(() => {
    setSelectedUtterance(null);
    setSelectedPoint(null);
    setSidePanelOpen(false);
  }, []);

  if (state === "upload" || state === "processing") {
    return (
      <div
        className="h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <FileUpload
          onFileSelect={handleFileSelect}
          isProcessing={state === "processing"}
          stage={stage}
        />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col" role="application" aria-label="IdeaTracer 회의 분석">
      {/* 상단 헤더 (2.4.2 — 제목 제공) */}
      <header
        style={{
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border)",
          padding: "8px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: "12px",
        }}
      >
        {/* 브랜드 + 요약 */}
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: "15px",
              fontWeight: 590,
              color: "var(--text-primary)",
              letterSpacing: "-0.165px",
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            IdeaTracer
          </h1>
          {result.summary && (
            <p
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginTop: "2px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "280px",
              }}
            >
              {result.summary}
            </p>
          )}
        </div>

        {/* 액션 버튼 그룹 */}
        <nav aria-label="주요 기능" className="header-actions">
          <ThemeToggle />
          {[
            { label: "공유 링크", onClick: handleShare },
            { label: "MD 내보내기", onClick: handleExportMarkdown },
            { label: "Notion 내보내기", onClick: handleExportNotion },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.onClick}
              style={{
                fontSize: "12px",
                fontWeight: 510,
                padding: "5px 12px",
                borderRadius: "6px",
                background: "var(--surface-hover)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {btn.label}
            </button>
          ))}
          <button
            onClick={() => {
              setState("upload");
              setResult(emptyResult);
              setSelectedUtterance(null);
              setSidePanelOpen(true);
              setAudioUrl(null);
            }}
            aria-label="새 회의 시작 — 현재 분석 결과를 지우고 처음으로 돌아갑니다"
            style={{
              fontSize: "12px",
              fontWeight: 510,
              padding: "5px 12px",
              borderRadius: "6px",
              background: "var(--brand)",
              border: "none",
              color: "#ffffff",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            새 회의
          </button>
        </nav>
      </header>

      {/* 메인 영역 */}
      <main id="main-content" className="flex flex-1 overflow-hidden" tabIndex={-1}>
        <ErrorBoundary>
          <MindMap
            result={result}
            selectedUtterance={selectedUtterance}
            currentTimeMs={currentTimeMs}
            onSelectUtterance={(u) => {
              setSelectedUtterance(u);
              setSelectedPoint(null);
              setSidePanelOpen(true);
              handleSeek(u.startMs);
            }}
            onSelectPoint={handleSelectPoint}
            onDeselect={handleCloseSidePanel}
            onUpdateUtterance={handleUpdateUtterance}
          />
        </ErrorBoundary>

        {/* 모바일 백드롭 */}
        {sidePanelOpen && (
          <div
            className="side-panel-backdrop"
            onClick={handleCloseSidePanel}
            aria-hidden="true"
          />
        )}

        {sidePanelOpen && (
          <SidePanel
            utterance={selectedUtterance}
            selectedPoint={selectedPoint}
            result={result}
            onClose={handleCloseSidePanel}
            onSeek={handleSeek}
          />
        )}
      </main>

      {/* 오디오 플레이어 */}
      <AudioPlayer
        audioUrl={audioUrl}
        seekMs={seekMs}
        topics={result.topics}
        utterances={result.utterances}
        onTimeUpdate={setCurrentTimeMs}
        onTopicMarkerClick={handleTopicMarkerClick}
      />
    </div>
  );
}
