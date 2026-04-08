import { NextRequest } from "next/server";
import type { Utterance, AnalyzedUtterance, AnalysisResult } from "@/lib/types";

const SYSTEM_PROMPT = `당신은 회의 맥락 분석 전문가입니다. 회의 발언 배열을 받아 각 발언을 분석합니다.

각 발언에 대해 반드시 다음을 판단하세요:
- emotion: "positive" | "negative" | "neutral" | "conflict"
- intent: "proposal" | "objection" | "agreement" | "question" | "info"
- keyPhrase: 핵심 키워드 (한국어, 3-5단어)
- relatedTo: 의미적으로 연결된 다른 발언의 인덱스 배열

또한 전체 회의 요약(summary)을 1-2문장으로 작성하세요.

반드시 아래 JSON 형식만 반환하세요:
{
  "utterances": [
    { "index": 0, "emotion": "...", "intent": "...", "keyPhrase": "...", "relatedTo": [...] },
    ...
  ],
  "summary": "..."
}`;

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "your_openai_api_key_here") {
    return Response.json(
      { error: "OPENAI_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const { utterances } = (await request.json()) as { utterances: Utterance[] };
    if (!utterances?.length) {
      return Response.json(
        { error: "분석할 발언이 없습니다." },
        { status: 400 }
      );
    }

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
      }),
    });

    if (!oaiResponse.ok) {
      const err = await oaiResponse.text();
      return Response.json(
        { error: `OpenAI API 오류: ${err}` },
        { status: oaiResponse.status }
      );
    }

    const oaiData = await oaiResponse.json();
    const parsed = JSON.parse(oaiData.choices[0].message.content);

    const analyzed: AnalyzedUtterance[] = utterances.map((u, i) => {
      const analysis = parsed.utterances.find(
        (a: { index: number }) => a.index === i
      ) || { emotion: "neutral", intent: "info", keyPhrase: "", relatedTo: [] };

      return {
        ...u,
        index: i,
        emotion: analysis.emotion,
        intent: analysis.intent,
        keyPhrase: analysis.keyPhrase,
        relatedTo: analysis.relatedTo,
      };
    });

    const result: AnalysisResult = {
      utterances: analyzed,
      summary: parsed.summary || "",
    };

    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: `분석 실패: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}
