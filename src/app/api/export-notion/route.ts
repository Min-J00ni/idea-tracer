import { NextRequest } from "next/server";
import type { AnalyzedUtterance } from "@/lib/types";
import { rateLimit, maskUpstreamError } from "@/lib/api-guard";

const MAX_EXPORT_ITEMS = 100;

export async function POST(request: NextRequest) {
  // Rate limit: 분당 5회 (Notion 쓰기는 스팸 위험이 크므로 보수적으로)
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
    const { utterances, meetingTitle } = body as {
      utterances: unknown;
      meetingTitle?: unknown;
    };

    // 입력 검증
    if (!Array.isArray(utterances) || utterances.length === 0) {
      return Response.json({ error: "내보낼 발언이 없습니다." }, { status: 400 });
    }
    if (utterances.length > MAX_EXPORT_ITEMS * 10) {
      return Response.json(
        { error: "발언 수가 너무 많습니다." },
        { status: 413 }
      );
    }

    const title =
      typeof meetingTitle === "string" && meetingTitle.trim().length > 0
        ? meetingTitle.trim().slice(0, 200) // 제목 최대 200자
        : `회의 노트 ${new Date().toLocaleDateString("ko-KR")}`;

    const validUtterances = utterances as AnalyzedUtterance[];

    // proposal / objection 발언만 추출, 최대 100개 제한
    const actionItems = validUtterances
      .filter((u) => u.intent === "proposal" || u.intent === "objection")
      .slice(0, MAX_EXPORT_ITEMS);

    if (!actionItems.length) {
      return Response.json({ message: "내보낼 Action Item이 없습니다.", count: 0 });
    }

    const notionResponse = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          title: {
            title: [{ text: { content: title } }],
          },
        },
        children: [
          {
            object: "block",
            type: "heading_2",
            heading_2: {
              rich_text: [{ text: { content: "Action Items" } }],
            },
          },
          ...actionItems.map((item) => ({
            object: "block" as const,
            type: "to_do" as const,
            to_do: {
              rich_text: [
                {
                  text: {
                    content: `[${item.speaker} ${formatMs(item.startMs)}] ${item.text}`.slice(0, 2000),
                  },
                },
              ],
              checked: false,
            },
          })),
        ],
      }),
    });

    if (!notionResponse.ok) {
      const detail = await notionResponse.text();
      return maskUpstreamError(notionResponse.status, "Notion", detail);
    }

    const page = await notionResponse.json();
    return Response.json({
      message: "Notion에 내보내기 완료",
      count: actionItems.length,
      pageUrl: page.url,
    });
  } catch {
    return Response.json(
      { error: "Notion 내보내기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
