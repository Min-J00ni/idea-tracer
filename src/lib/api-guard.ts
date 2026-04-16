import { NextRequest } from "next/server";

// ─── Rate Limiting ──────────────────────────────────────────────────────────
// 인메모리 스토어 (단일 인스턴스 환경용; Vercel 멀티인스턴스에서는 추후 Redis로 교체)
const store = new Map<string, { count: number; resetAt: number }>();

/** IP × endpoint 기준 rate limiting. 초과 시 429 Response 반환, 통과 시 null */
export function rateLimit(
  request: NextRequest,
  endpoint: string,
  limit: number,
  windowMs: number
): Response | null {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    request.headers.get("x-real-ip") ??
    "unknown";

  const key = `${ip}:${endpoint}`;
  const now = Date.now();
  const record = store.get(key);

  if (!record || now > record.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return Response.json(
      { error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  record.count++;
  return null;
}

// ─── File Validation ─────────────────────────────────────────────────────────
const ALLOWED_AUDIO_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/wave",
  "audio/mp4",
  "audio/m4a",
  "audio/x-m4a",
  "audio/webm",
  "audio/ogg",
  "audio/aac",
  "audio/flac",
  "video/mp4",   // m4a가 video/mp4로 잡히는 경우
  "video/webm",  // webm audio가 video/webm으로 올 수 있음
]);

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50 MB

/** 파일 크기·MIME 타입 검증. 실패 시 에러 Response 반환, 통과 시 null */
export function validateAudioFile(file: File): Response | null {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return Response.json(
      { error: "파일 크기가 너무 큽니다. 최대 50 MB까지 지원합니다." },
      { status: 413 }
    );
  }

  if (!ALLOWED_AUDIO_TYPES.has(file.type)) {
    return Response.json(
      {
        error:
          "지원하지 않는 파일 형식입니다. MP3, WAV, M4A, WebM, OGG, AAC, FLAC만 허용됩니다.",
      },
      { status: 415 }
    );
  }

  return null;
}

// ─── Utterance Validation ─────────────────────────────────────────────────────
export const MAX_UTTERANCES = 200;
export const MAX_TEXT_LENGTH = 2_000;   // 발언 1개 최대 2000자
export const MAX_TOTAL_CHARS = 200_000; // 전체 최대 20만자 (≈ gpt-4o 128k 토큰 이내)

/** 발언 배열 크기·내용 검증. 실패 시 에러 Response 반환, 통과 시 null */
export function validateUtterances(
  utterances: unknown
): Response | null {
  if (!Array.isArray(utterances) || utterances.length === 0) {
    return Response.json(
      { error: "분석할 발언이 없습니다." },
      { status: 400 }
    );
  }

  if (utterances.length > MAX_UTTERANCES) {
    return Response.json(
      {
        error: `발언 수가 너무 많습니다. 최대 ${MAX_UTTERANCES}개까지 분석할 수 있습니다.`,
      },
      { status: 413 }
    );
  }

  let totalChars = 0;
  for (const u of utterances as Array<Record<string, unknown>>) {
    if (typeof u.text !== "string") {
      return Response.json(
        { error: "잘못된 발언 형식입니다." },
        { status: 400 }
      );
    }
    if (u.text.length > MAX_TEXT_LENGTH) {
      return Response.json(
        {
          error: `발언 텍스트가 너무 깁니다. 발언 1개당 최대 ${MAX_TEXT_LENGTH}자입니다.`,
        },
        { status: 413 }
      );
    }
    totalChars += u.text.length;
  }

  if (totalChars > MAX_TOTAL_CHARS) {
    return Response.json(
      { error: "회의 내용이 너무 깁니다. 더 짧은 구간을 분석해주세요." },
      { status: 413 }
    );
  }

  return null;
}

// ─── Error Masking ────────────────────────────────────────────────────────────
/**
 * Upstream(Deepgram / OpenAI / Notion) 에러를 클라이언트에 그대로 노출하지 않고
 * 안전한 메시지만 반환한다. 상세 오류는 서버 로그에만 기록.
 */
export function maskUpstreamError(
  upstreamStatus: number,
  context: string,
  detail: string
): Response {
  // 서버 로그에만 기록 (클라이언트에는 전달 안 됨)
  console.error(`[api-guard] ${context} upstream ${upstreamStatus}: ${detail}`);

  switch (true) {
    case upstreamStatus === 401 || upstreamStatus === 403:
      return Response.json(
        { error: "API 인증에 실패했습니다. 서버 설정을 확인해주세요." },
        { status: 502 }
      );
    case upstreamStatus === 429:
      return Response.json(
        { error: "외부 API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    case upstreamStatus >= 500:
      return Response.json(
        { error: `${context} 서비스가 일시적으로 불가합니다. 잠시 후 다시 시도해주세요.` },
        { status: 502 }
      );
    default:
      return Response.json(
        { error: `${context} 처리 중 오류가 발생했습니다.` },
        { status: 502 }
      );
  }
}
