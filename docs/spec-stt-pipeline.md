# STT 파이프라인 스펙

> 마스터플랜 F-01, F-03 대응 | 작성일: 2026-04-09

---

## 1. 현재 상태

| 항목 | 구현 | 갭 |
|------|------|-----|
| 오디오 파일 업로드 | ✅ FormData → API Route | 파일 크기 제한/유효성 검증 없음 |
| STT 엔진 | ✅ Deepgram Nova-2 | 한국어 전용 엔진(Clova) 미적용 |
| 화자 분리 | ✅ diarize=true | 화자 이름 매핑 UI 없음 |
| 지원 포맷 | △ audio/* 수용 | 서버단 포맷 검증 없음 |
| 배치 업로드 | ❌ | 1개만 처리 가능 |
| 실시간 봇 | ❌ | 미구현 |

---

## 2. 목표 아키텍처

```
[클라이언트]
  ├── 파일 선택 (드래그 또는 클릭)
  ├── 유효성 검증 (포맷, 크기, 개수)
  └── FormData POST → /api/stt
  
[/api/stt]
  ├── 파일 유효성 재검증
  ├── 언어 감지 또는 사용자 선택
  ├── STT 엔진 라우팅
  │   ├── 한국어 → Clova Speech API (1순위) / Deepgram (폴백)
  │   └── 영어 → Deepgram Nova-2
  ├── 응답 정규화 → Utterance[]
  └── Response 반환
```

---

## 3. 입력 스펙

### 3.1 지원 파일 포맷

| 포맷 | MIME Type | 최대 크기 | 비고 |
|------|-----------|----------|------|
| MP3 | audio/mpeg | 200MB | 가장 일반적 |
| WAV | audio/wav | 500MB | 무압축, 크기 큼 |
| M4A | audio/mp4, audio/x-m4a | 200MB | iOS 녹음 기본 |
| WebM | audio/webm | 200MB | 브라우저 녹음 |
| MP4 | video/mp4 | 500MB | 비디오에서 오디오 추출 |

### 3.2 제한 사항

- 최대 파일 크기: 500MB (개별)
- 최대 녹음 길이: 120분
- 배치 업로드: 최대 5개 동시 (MVP에서는 1개, v1에서 확장)
- 빈 파일 / 무음 파일 → 에러 반환

### 3.3 클라이언트 검증 (업로드 전)

```typescript
// 업로드 전 검증 항목
interface FileValidation {
  maxSizeMB: 500;
  allowedTypes: ["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/webm", "video/mp4"];
  maxDurationMin: 120;  // Audio API로 길이 확인
  maxFiles: 5;          // v1
}
```

---

## 4. STT 엔진 전략

### 4.1 MVP 단계: Deepgram Nova-2 단일

현재 구현 유지. 한국어 품질이 허용 가능한 수준인지 실제 회의 파일로 테스트.

**테스트 기준:**
- 5분 회의 파일 10개 (한국어)
- 정확도 목표: WER(Word Error Rate) 15% 이하
- 화자 분리 정확도: 85% 이상

### 4.2 v1 단계: 듀얼 엔진

```typescript
// 엔진 선택 로직
function selectSTTEngine(language: "ko" | "en" | "auto"): STTEngine {
  if (language === "ko") return "clova";     // 한국어 → Clova 우선
  if (language === "en") return "deepgram";  // 영어 → Deepgram
  // auto: 첫 30초를 Whisper로 언어 감지 후 라우팅
  return "auto-detect";
}
```

### 4.3 Clova Speech API 연동 (v1)

```
POST https://clovaspeech-gw.ncloud.com/recog/v1/stt
Headers:
  X-CLOVASPEECH-API-KEY: {key}
  Content-Type: application/octet-stream
Query: ?lang=ko&diarization.enable=true
```

**Clova 장점:** 한국어 WER 업계 최저, 전문 용어 인식 우수
**Clova 제약:** 영어 품질 떨어짐, 파일 크기 제한 있음

---

## 5. 출력 스펙

### 5.1 정규화된 응답

```typescript
interface STTResponse {
  utterances: Utterance[];
  metadata: {
    duration: number;       // 총 길이 (ms)
    language: string;       // 감지된 언어
    speakerCount: number;   // 감지된 화자 수
    engine: string;         // 사용된 엔진
    confidence: number;     // 평균 신뢰도 (0~1)
  };
}

interface Utterance {
  speaker: string;    // "화자 1", "화자 2" ...
  text: string;       // 전사된 텍스트
  startMs: number;    // 시작 시간 (ms)
  endMs: number;      // 종료 시간 (ms)
  confidence?: number; // 개별 발언 신뢰도
}
```

### 5.2 현재 코드와의 차이

| 항목 | 현재 | 목표 |
|------|------|------|
| metadata | ❌ 없음 | ✅ duration, language, speakerCount 포함 |
| confidence | ❌ 없음 | ✅ 발언별 신뢰도 |
| 화자 이름 | "화자 1" 고정 | 사용자가 이름 매핑 가능 |

---

## 6. 에러 처리

| 에러 코드 | 상황 | 사용자 메시지 |
|----------|------|-------------|
| 400 | 파일 없음 / 잘못된 포맷 | "지원하지 않는 파일 형식입니다. MP3, WAV, M4A를 사용해주세요." |
| 413 | 파일 크기 초과 | "파일이 너무 큽니다. 500MB 이하 파일을 업로드해주세요." |
| 422 | 무음 / 인식 불가 | "음성을 인식할 수 없습니다. 녹음 상태를 확인해주세요." |
| 429 | API Rate Limit | "처리 요청이 많습니다. 잠시 후 다시 시도해주세요." |
| 500 | STT 엔진 오류 | "음성 변환 중 오류가 발생했습니다. 다시 시도해주세요." |

---

## 7. 성능 목표

| 지표 | 목표 |
|------|------|
| 5분 파일 처리 시간 | < 30초 |
| 30분 파일 처리 시간 | < 3분 |
| 60분 파일 처리 시간 | < 5분 |
| 한국어 WER | < 15% |
| 화자 분리 정확도 | > 85% |

---

## 8. TODO (구현 순서)

1. [ ] 클라이언트 파일 유효성 검증 추가 (포맷, 크기)
2. [ ] 서버 파일 크기 제한 (Next.js config)
3. [ ] STT 응답에 metadata 필드 추가
4. [ ] 에러 메시지 사용자 친화적으로 개선
5. [ ] Deepgram 한국어 품질 테스트 (실제 회의 파일 10개)
6. [ ] 품질 미달 시 Clova Speech API 연동
7. [ ] 화자 이름 매핑 UI 추가
8. [ ] 배치 업로드 (v1)
