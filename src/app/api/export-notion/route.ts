import { NextRequest } from "next/server";
import type { AnalyzedUtterance } from "@/lib/types";

export async function POST(request: NextRequest) {
  const apiKey = process.env.NOTION_API_KEY;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!apiKey || apiKey === "your_notion_api_key_here") {
    return Response.json(
      { error: "NOTION_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }
  if (!databaseId || databaseId === "your_notion_database_id_here") {
    return Response.json(
      { error: "NOTION_DATABASE_ID가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { utterances, meetingTitle } = (await request.json()) as {
      utterances: AnalyzedUtterance[];
      meetingTitle?: string;
    };

    // proposal 또는 objection인 발언만 Action Item으로 추출
    const actionItems = utterances.filter(
      (u) => u.intent === "proposal" || u.intent === "objection"
    );

    if (!actionItems.length) {
      return Response.json({ message: "내보낼 Action Item이 없습니다.", count: 0 });
    }

    const title = meetingTitle || `회의 노트 ${new Date().toLocaleDateString("ko-KR")}`;

    // Notion 페이지 생성
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
                    content: `[${item.speaker} ${formatMs(item.startMs)}] ${item.text}`,
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
      const err = await notionResponse.text();
      return Response.json(
        { error: `Notion API 오류: ${err}` },
        { status: notionResponse.status }
      );
    }

    const page = await notionResponse.json();
    return Response.json({
      message: "Notion에 내보내기 완료",
      count: actionItems.length,
      pageUrl: page.url,
    });
  } catch (error) {
    return Response.json(
      { error: `Notion 내보내기 실패: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
