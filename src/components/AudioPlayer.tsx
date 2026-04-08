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

  return (
    <div className="bg-white border-t border-gray-200 px-5 py-3 flex items-center gap-4">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration((audioRef.current?.duration || 0) * 1000)}
        onEnded={() => setIsPlaying(false)}
      />
      <button
        onClick={togglePlay}
        className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm hover:bg-gray-700 transition-colors"
      >
        {isPlaying ? "⏸" : "▶"}
      </button>
      <div className="flex-1 flex items-center gap-2">
        <span className="text-xs text-gray-500 w-10">{formatMs(currentTime)}</span>
        <div className="flex-1 h-1 bg-gray-200 rounded-full relative">
          <div
            className="h-1 bg-gray-900 rounded-full transition-all"
            style={{ width: duration ? `${(currentTime / duration) * 100}%` : "0%" }}
          />
        </div>
        <span className="text-xs text-gray-500 w-10">{formatMs(duration)}</span>
      </div>
    </div>
  );
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
