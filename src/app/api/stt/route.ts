import { NextRequest } from "next/server";
import type { Utterance } from "@/lib/types";
import { rateLimit, validateAudioFile, maskUpstreamError } from "@/lib/api-guard";

export async function POST(request: NextRequest) {
  // Rate limit: 분당 5회 (STT는 비용이 크므로 보수적으로)
  const limited = rateLimit(request, "stt", 5, 60_000);
  if (limited) return limited;

  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey || apiKey.startsWith("your_")) {
    return Response.json(
      { error: "DEEPGRAM_API_KEY가 설정되지 않았습니다." },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("audio") as File | null;
    if (!file) {
      return Response.json({ error: "오디오 파일이 필요합니다." }, { status: 400 });
    }

    // 파일 크기 + MIME 타입 검증
    const fileError = validateAudioFile(file);
    if (fileError) return fileError;

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
      const detail = await dgResponse.text();
      return maskUpstreamError(dgResponse.status, "Deepgram STT", detail);
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
  } catch {
    return Response.json({ error: "STT 처리 중 오류가 발생했습니다." }, { status: 500 });
  }
}
