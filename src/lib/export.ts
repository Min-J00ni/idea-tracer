import type { AnalysisResult } from "./types";
import { EMOTION_CONFIG } from "./constants";

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function toMarkdown(result: AnalysisResult): string {
  const lines: string[] = [];

  lines.push("# 회의 마인드맵\n");

  if (result.summary) {
    lines.push(`> ${result.summary}\n`);
  }

  for (const topic of result.topics) {
    lines.push(`## ${topic.title}`);

    const topicUtterances = result.utterances.filter(
      (u) => u.topicId === topic.id
    );

    for (const u of topicUtterances) {
      const emotion = EMOTION_CONFIG[u.emotion];
      lines.push(
        `- ${emotion.icon} [${u.speaker} ${formatMs(u.startMs)}] ${u.text}`
      );
    }

    lines.push("");
  }

  if (result.actionItems.length > 0) {
    lines.push("## 액션 아이템");
    for (const item of result.actionItems) {
      const assignee = item.assignee ? ` (담당: ${item.assignee})` : "";
      const deadline = item.deadline ? `, 기한: ${item.deadline}` : "";
      lines.push(`- [ ] ${item.text}${assignee}${deadline}`);
    }
    lines.push("");
  }

  if (result.decisions.length > 0) {
    lines.push("## 핵심 결정");
    for (const decision of result.decisions) {
      lines.push(`- ${decision}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function downloadText(content: string, filename: string, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function encodeShareData(result: AnalysisResult): string {
  return btoa(encodeURIComponent(JSON.stringify(result)));
}

export function decodeShareData(encoded: string): AnalysisResult | null {
  try {
    return JSON.parse(decodeURIComponent(atob(encoded)));
  } catch {
    return null;
  }
}
