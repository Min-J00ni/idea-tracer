import { NextRequest } from "next/server";
import type { Utterance, AnalyzedUtterance, AnalysisResult, Topic, ActionItem } from "@/lib/types";
import { rateLimit, validateUtterances, maskUpstreamError } from "@/lib/api-guard";

const SYSTEM_PROMPT = `당신은 회의 맥락 분석 전문가입니다. 회의 발언 배열을 받아 구조화된 분석을 수행합니다.

1단계: 발언들을 주제별로 그룹화하세요 (최대 7개 주제).
2단계: 각 발언을 분석하세요.

각 발언에 대해:
- topicId: 소속 주제 ID (topic-0, topic-1, ...)
- emotion: "positive" | "negative" | "neutral" | "conflict"
- intent: "proposal" | "objection" | "agreement" | "question" | "info" | "decision"
- keyPhrase: 핵심 키워드 (한국어, 3-5단어)
- importance: 0.0~1.0 (회의 내 중요도)
- relatedTo: [{ "targetIndex": 번호, "type": "supports"|"opposes"|"extends"|"resolves" }]

또한:
- 전체 회의 요약(summary)을 2-3문장으로 작성
- intent가 "proposal" 또는 "decision"인 발언에서 액션아이템 추출
- 핵심 결정사항을 리스트로 정리

반드시 아래 JSON 형식만 반환하세요:
{
  "topics": [
    { "id": "topic-0", "title": "주제명", "utteranceIndices": [0, 2], "importance": 0.9 }
  ],
  "utterances": [
    { "index": 0, "topicId": "topic-0", "emotion": "...", "intent": "...", "keyPhrase": "...", "importance": 0.8, "relatedTo": [{ "targetIndex": 1, "type": "supports" }] }
  ],
  "actionItems": [
    { "text": "액션 내용", "assignee": "담당자 or null", "deadline": "기한 or null", "sourceIndex": 0 }
  ],
  "decisions": ["결정사항1"],
  "summary": "..."
}`;

export async function POST(request: NextRequest) {
  // Rate limit: 분당 10회
  const limited = rateLimit(request, "analyze", 10, 60_000);
  if (limited) return limited;

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    return Response.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { utterances } = body as { utterances: Utterance[] };

    // 발언 배열 크기·내용 검증 (토큰 폭탄 방지)
    const validationError = validateUtterances(utterances);
    if (validationError) return validationError;

    const userMessage = utterances
      .map((u, i) => `[${i}] ${u.speaker} (${formatMs(u.startMs)}): ${u.text}`)
      .join("\n");

    const oaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
        max_tokens: 8_000, // 응답 토큰 상한 명시
      }),
    });

    if (!oaiResponse.ok) {
      const detail = await oaiResponse.text();
      return maskUpstreamError(oaiResponse.status, "OpenAI", detail);
    }

    const oaiData = await oaiResponse.json();
    const parsed = JSON.parse(oaiData.choices[0].message.content);

    const topics: Topic[] = (parsed.topics || []).map((t: Topic) => ({
      id: t.id,
      title: t.title,
      utteranceIndices: t.utteranceIndices,
      importance: t.importance ?? 0.5,
    }));

    const analyzed: AnalyzedUtterance[] = utterances.map((u, i) => {
      const analysis = parsed.utterances?.find(
        (a: { index: number }) => a.index === i
      ) || {
        topicId: topics[0]?.id || "topic-0",
        emotion: "neutral",
        intent: "info",
        keyPhrase: "",
        importance: 0.5,
        relatedTo: [],
      };

      return {
        ...u,
        index: i,
        topicId: analysis.topicId || topics[0]?.id || "topic-0",
        emotion: analysis.emotion,
        intent: analysis.intent,
        keyPhrase: analysis.keyPhrase,
        importance: analysis.importance ?? 0.5,
        relatedTo: (analysis.relatedTo || []).map(
          (r: { targetIndex: number; type?: string }) => ({
            targetIndex: r.targetIndex,
            type: r.type || "extends",
          })
        ),
      };
    });

    const actionItems: ActionItem[] = (parsed.actionItems || []).map(
      (a: ActionItem) => ({
        text: a.text,
        assignee: a.assignee || null,
        deadline: a.deadline || null,
        sourceIndex: a.sourceIndex,
      })
    );

    const result: AnalysisResult = {
      topics,
      utterances: analyzed,
      actionItems,
      decisions: parsed.decisions || [],
      summary: parsed.summary || "",
    };

    return Response.json(result);
  } catch {
    return Response.json(
      { error: "분석 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
