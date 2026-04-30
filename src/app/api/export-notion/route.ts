import { NextRequest } from "next/server";
import type { AnalysisResult, ActionItem, Topic } from "@/lib/types";
import { rateLimit } from "@/lib/api-guard";

const MAX_EXPORT_ITEMS = 100;

export async function POST(request: NextRequest) {
  const limited = rateLimit(request, "export-notion", 5, 60_000);
  if (limited) return limited;

  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || apiKey.startsWith("your_")) {
    return Response.json(
      { error: "NOTION_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }
  if (!databaseId || databaseId.startsWith("your_")) {
    return Response.json(
      { error: "NOTION_DATABASE_ID가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { result, meetingTitle } = body as {
      result: unknown;
      meetingTitle?: unknown;
    };

    if (
      !result ||
      typeof result !== "object" ||
      !Array.isArray((result as AnalysisResult).utterances)
    ) {
      return Response.json({ error: "올바르지 않은 분석 결과입니다." }, { status: 400 });
    }

    const analysisResult = result as AnalysisResult;

    if (analysisResult.actionItems.length === 0) {
      return Response.json({ message: "내보낼 액션아이템이 없습니다.", count: 0 });
    }

    const title =
      typeof meetingTitle === "string" && meetingTitle.trim().length > 0
        ? meetingTitle.trim().slice(0, 200)
        : `회의 노트 ${new Date().toLocaleDateString("ko-KR")}`;

    const items = analysisResult.actionItems.slice(0, MAX_EXPORT_ITEMS);

    // 액션아이템 1개 = Notion DB 1개 row 생성
    const results = await Promise.allSettled(
      items.map((action) =>
        createNotionRow(apiKey, databaseId, action, analysisResult, title)
      )
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    return Response.json({
      message: failed > 0
        ? `${succeeded}개 완료, ${failed}개 실패`
        : `Notion에 ${succeeded}개 항목이 추가됐습니다.`,
      count: succeeded,
      failed,
    });
  } catch {
    return Response.json(
      { error: "Notion 내보내기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

async function createNotionRow(
  apiKey: string,
  databaseId: string,
  action: ActionItem,
  result: AnalysisResult,
  meetingTitle: string
): Promise<void> {
  // 액션아이템이 속한 주제 찾기
  const sourceUtterance = result.utterances.find((u) => u.index === action.sourceIndex);
  const topic: Topic | undefined = sourceUtterance
    ? result.topics.find((t) => t.id === sourceUtterance.topicId)
    : undefined;

  // 주제에 속한 쟁점 찾기
  const issues = topic?.points
    ?.filter((p) => p.type === "쟁점" || p.type === "미해결")
    .map((p) => p.summary)
    ?? [];

  // 미결 쟁점 (result.unresolved) 추가
  const unresolvedText = result.unresolved?.join(", ") ?? "";
  const issueText = [...issues, ...(unresolvedText ? [unresolvedText] : [])]
    .join(" / ")
    .slice(0, 2000);

  const properties: Record<string, unknown> = {
    // 제목 — 액션아이템 내용
    이름: {
      title: [{ text: { content: action.text.slice(0, 2000) } }],
    },
    // 담당자
    담당자: {
      rich_text: [{ text: { content: action.assignee ?? "" } }],
    },
    // 주제 노드
    주제: {
      rich_text: [{ text: { content: topic?.title ?? "" } }],
    },
    // 쟁점
    쟁점: {
      rich_text: [{ text: { content: issueText } }],
    },
  };

  // 마감일 (날짜 형식일 때만)
  if (action.deadline) {
    const parsed = parseDeadline(action.deadline);
    if (parsed) {
      properties["마감일"] = { date: { start: parsed } };
    } else {
      // 날짜 형식이 아니면 쟁점 앞에 텍스트로 추가
      properties["담당자"] = {
        rich_text: [
          { text: { content: `${action.assignee ?? ""} (기한: ${action.deadline})` } },
        ],
      };
    }
  }

  // 페이지 본문 — 원문 발언 quote 블록
  const children: unknown[] = [];
  if (result.summary) {
    children.push({
      object: "block",
      type: "callout",
      callout: {
        icon: { emoji: "📋" },
        rich_text: [{ text: { content: `회의: ${meetingTitle}` } }],
        color: "gray_background",
      },
    });
  }
  if (sourceUtterance) {
    children.push({
      object: "block",
      type: "quote",
      quote: {
        rich_text: [
          {
            text: {
              content: `${sourceUtterance.speaker} ${formatMs(sourceUtterance.startMs)}  `,
            },
            annotations: { bold: true },
          },
          { text: { content: sourceUtterance.text.slice(0, 1900) } },
        ],
      },
    });
  }

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Notion-Version": "2022-06-28",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
      ...(children.length > 0 ? { children } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Notion API 오류 (${res.status}): ${detail}`);
  }
}

/** "2026-05-01", "5월 1일", "내일" 등을 ISO 날짜로 변환 */
function parseDeadline(deadline: string): string | null {
  // ISO 형식 (YYYY-MM-DD)
  if (/^\d{4}-\d{2}-\d{2}$/.test(deadline)) return deadline;

  // "YYYY년 MM월 DD일" 형식
  const korean = deadline.match(/(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일/);
  if (korean) {
    const [, y, m, d] = korean;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // "MM월 DD일" 형식 (현재 연도 사용)
  const monthDay = deadline.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (monthDay) {
    const year = new Date().getFullYear();
    const [, m, d] = monthDay;
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
