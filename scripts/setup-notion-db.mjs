/**
 * Notion DB 스키마 자동 설정 스크립트
 * 실행: node scripts/setup-notion-db.mjs
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// .env.local 파싱
const envPath = resolve(process.cwd(), ".env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf-8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => line.split("=").map((s) => s.trim()))
);

const API_KEY = env.NOTION_API_KEY;
const DATABASE_ID = env.NOTION_DATABASE_ID;

if (!API_KEY || API_KEY.startsWith("your_")) {
  console.error("❌ NOTION_API_KEY가 설정되지 않았습니다.");
  process.exit(1);
}
if (!DATABASE_ID || DATABASE_ID.startsWith("your_")) {
  console.error("❌ NOTION_DATABASE_ID가 설정되지 않았습니다.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${API_KEY}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
};

console.log("🔍 현재 DB 속성 확인 중...");

// 1. 현재 DB 속성 조회
const getRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, { headers });
if (!getRes.ok) {
  const err = await getRes.text();
  console.error("❌ DB 조회 실패:", err);
  process.exit(1);
}

const db = await getRes.json();
const existing = Object.keys(db.properties);
console.log("현재 컬럼:", existing.join(", "));

// 2. 추가할 속성 정의
const toAdd = {};

if (!existing.includes("담당자")) {
  toAdd["담당자"] = { rich_text: {} };
}
if (!existing.includes("마감일")) {
  toAdd["마감일"] = { date: {} };
}
if (!existing.includes("주제")) {
  toAdd["주제"] = { rich_text: {} };
}
if (!existing.includes("쟁점")) {
  toAdd["쟁점"] = { rich_text: {} };
}

if (Object.keys(toAdd).length === 0) {
  console.log("✅ 모든 컬럼이 이미 존재합니다. 설정 완료.");
  process.exit(0);
}

console.log("➕ 추가할 컬럼:", Object.keys(toAdd).join(", "));

// 3. DB 업데이트
const patchRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}`, {
  method: "PATCH",
  headers,
  body: JSON.stringify({ properties: toAdd }),
});

if (!patchRes.ok) {
  const err = await patchRes.text();
  console.error("❌ DB 업데이트 실패:", err);
  process.exit(1);
}

console.log("✅ Notion DB 설정 완료!");
console.log("추가된 컬럼:", Object.keys(toAdd).join(", "));
