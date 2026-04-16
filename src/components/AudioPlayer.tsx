"use client";

import { useRef, useEffect, useCallback, useState } from "react";

interface Props {
  audioUrl: string | null;
  seekMs: number | null;
  onTimeUpdate: (ms: number) => void;
}

export default function AudioPlayer({ audioUrl, seekMs, onTimeUpdate }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (seekMs !== null && audioRef.current) {
      audioRef.current.currentTime = seekMs / 1000;
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [seekMs]);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const ms = Math.round(audioRef.current.currentTime * 1000);
      setCurrentTime(ms);
      onTimeUpdate(ms);
    }
  }, [onTimeUpdate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  if (!audioUrl) return null;

  const progress = duration ? currentTime / duration : 0;

  return (
    <div
      style={{
        background: "#0f1011",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "10px 20px",
        display: "flex",
        alignItems: "center",
        gap: "12px",
      }}
    >
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() =>
          setDuration((audioRef.current?.duration || 0) * 1000)
        }
        onEnded={() => setIsPlaying(false)}
      />

      {/* 재생 버튼 */}
      <button
        onClick={togglePlay}
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          background: "#5e6ad2",
          border: "none",
          color: "#ffffff",
          fontSize: "12px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "background 0.15s",
        }}
        onMouseOver={(e) => ((e.currentTarget as HTMLElement).style.background = "#7170ff")}
        onMouseOut={(e) => ((e.currentTarget as HTMLElement).style.background = "#5e6ad2")}
      >
        {isPlaying ? "⏸" : "▶"}
      </button>

      {/* 타임라인 */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 510, color: "#62666d", width: "36px" }}>
          {formatMs(currentTime)}
        </span>
        <div
          style={{
            flex: 1,
            height: "3px",
            background: "rgba(255,255,255,0.08)",
            borderRadius: "9999px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: "#7170ff",
              borderRadius: "9999px",
              transition: "width 0.1s linear",
            }}
          />
        </div>
        <span style={{ fontSize: "11px", fontWeight: 510, color: "#62666d", width: "36px", textAlign: "right" }}>
          {formatMs(duration)}
        </span>
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
