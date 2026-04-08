import { NextRequest } from "next/server";
import type { Utterance } from "@/lib/types";

export async function POST(request: NextRequest) {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey || apiKey === "your_deepgram_api_key_here") {
    return Response.json(
      { error: "DEEPGRAM_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File;
    if (!file) {
      return Response.json(
        { error: "오디오 파일이 필요합니다." },
        { status: 400 }
      );
    }

    const audioBuffer = Buffer.from(await file.arrayBuffer());

    const dgResponse = await fetch(
      "https://api.deepgram.com/v1/listen?model=nova-2&language=ko&diarize=true&punctuate=true&utterances=true",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": file.type || "audio/wav",
        },
        body: audioBuffer,
      }
    );

    if (!dgResponse.ok) {
      const err = await dgResponse.text();
      return Response.json(
        { error: `Deepgram API 오류: ${err}` },
        { status: dgResponse.status }
      );
    }

    const data = await dgResponse.json();
    const utterances: Utterance[] = (data.results?.utterances || []).map(
      (u: { speaker: number; transcript: string; start: number; end: number }) => ({
        speaker: `화자 ${u.speaker + 1}`,
        text: u.transcript,
        startMs: Math.round(u.start * 1000),
        endMs: Math.round(u.end * 1000),
      })
    );

    return Response.json({ utterances });
  } catch (error) {
    return Response.json(
      { error: `STT 처리 실패: ${(error as Error).message}` },
      { status: 500 }
    );
  }
}
