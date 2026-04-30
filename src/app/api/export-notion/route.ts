import { NextRequest } from "next/server";
import type { AnalysisResult, AnalyzedUtterance, ActionItem } from "@/lib/types";
import { rateLimit, maskUpstreamError } from "@/lib/api-guard";

// Notion API의 단일 children 배열 최대 블록 수
const NOTION_BLOCK_LIMIT = 100;

export async function POST(request: NextRequest) {
  // Rate limit: 분당 5회
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

    // 입력 검증
    if (
      !result ||
      typeof result !== "object" ||
      !Array.isArray((result as AnalysisResult).utterances)
    ) {
      return Response.json({ error: "올바르지 않은 분석 결과입니다." }, { status: 400 });
    }

    const analysisResult = result as AnalysisResult;

    if (analysisResult.utterances.length === 0) {
      return Response.json({ error: "내보낼 발언이 없습니다." }, { status: 400 });
    }

    const title =
      typeof meetingTitle === "string" && meetingTitle.trim().length > 0
        ? meetingTitle.trim().slice(0, 200)
        : `회의 노트 ${new Date().toLocaleDateString("ko-KR")}`;

    const blocks = buildNotionBlocks(analysisResult);

    // Notion API 단일 요청 100블록 제한 — 초과분 truncate
    const safeBlocks = blocks.slice(0, NOTION_BLOCK_LIMIT);
    const truncated = blocks.length > NOTION_BLOCK_LIMIT;

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
        children: safeBlocks,
      }),
    });

    if (!notionResponse.ok) {
      const detail = await notionResponse.text();
      return maskUpstreamError(notionResponse.status, "Notion", detail);
    }

    const page = await notionResponse.json();

    return Response.json({
      message: truncated
        ? `Notion 내보내기 완료 (${NOTION_BLOCK_LIMIT}블록 제한으로 일부 생략됨)`
        : "Notion 내보내기 완료",
      pageUrl: page.url,
      totalBlocks: blocks.length,
      exportedBlocks: safeBlocks.length,
    });
  } catch {
    return Response.json(
      { error: "Notion 내보내기 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ── Notion 블록 빌더 ──────────────────────────────────────────

type NotionBlock = Record<string, unknown>;

function buildNotionBlocks(result: AnalysisResult): NotionBlock[] {
  const blocks: NotionBlock[] = [];

  // 1. 회의 요약 (callout)
  if (result.summary) {
    blocks.push({
      object: "block",
      type: "callout",
      callout: {
        icon: { emoji: "💡" },
        rich_text: [{ text: { content: result.summary.slice(0, 2000) } }],
        color: "gray_background",
      },
    });
    blocks.push({ object: "block", type: "divider", divider: {} });
  }

  // 2. 주제별 발언 + 관련 액션아이템
  for (const topic of result.topics) {
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ text: { content: topic.title } }],
      },
    });

    const topicUtterances = result.utterances
      .filter((u) => u.topicId === topic.id)
      .sort((a, b) => a.startMs - b.startMs);

    for (const u of topicUtterances) {
      blocks.push(buildQuoteBlock(u));
    }

    // 주제에 속한 액션아이템
    const topicActions = result.actionItems.filter((a) =>
      topicUtterances.some((u) => u.index === a.sourceIndex)
    );

    for (const action of topicActions) {
      blocks.push(buildTodoBlock(action));
    }
  }

  // 3. 핵심 결정
  if (result.decisions.length > 0) {
    blocks.push({ object: "block", type: "divider", divider: {} });
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ text: { content: "✅ 핵심 결정" } }],
      },
    });
    for (const d of result.decisions) {
      blocks.push({
        object: "block",
        type: "bulleted_list_item",
        bulleted_list_item: {
          rich_text: [{ text: { content: d.slice(0, 2000) } }],
        },
      });
    }
  }

  // 4. 전체 액션아이템 (주제 미귀속 포함)
  if (result.actionItems.length > 0) {
    blocks.push({ object: "block", type: "divider", divider: {} });
    blocks.push({
      object: "block",
      type: "heading_2",
      heading_2: {
        rich_text: [{ text: { content: "📋 전체 액션아이템" } }],
      },
    });
    for (const action of result.actionItems) {
      blocks.push(buildTodoBlock(action));
    }
  }

  return blocks;
}

function buildQuoteBlock(u: AnalyzedUtterance): NotionBlock {
  const timeLabel = formatMs(u.startMs);
  return {
    object: "block",
    type: "quote",
    quote: {
      rich_text: [
        {
          text: { content: `${u.speaker} ${timeLabel}  ` },
          annotations: { bold: true },
        },
        { text: { content: u.text.slice(0, 1900) } },
      ],
      color: "default",
    },
  };
}

function buildTodoBlock(action: ActionItem): NotionBlock {
  const meta: string[] = [];
  if (action.assignee) meta.push(`담당: ${action.assignee}`);
  if (action.deadline) meta.push(`기한: ${action.deadline}`);
  const suffix = meta.length > 0 ? `  (${meta.join(", ")})` : "";
  return {
    object: "block",
    type: "to_do",
    to_do: {
      rich_text: [
        { text: { content: (action.text + suffix).slice(0, 2000) } },
      ],
      checked: action.done ?? false,
    },
  };
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
