// lib/wrong-book.ts
"use client";

export type WrongBookSnapshot = Record<string, Record<string, string[]>>;
// 结构：{ [subject]: { [stage]: [qid, qid, ...] } }

const STORAGE_KEY = "wrongBook.v1";

function safeParse(json: string | null): WrongBookSnapshot {
  if (!json) return {};
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return {};
    return obj as WrongBookSnapshot;
  } catch {
    return {};
  }
}

function read(): WrongBookSnapshot {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY));
}

function write(data: WrongBookSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/** ✅ 新增一筆錯題（依 subject -> stage 分桶，qid 去重） */
export function addWrongQuestion(subject: string, stage: string, qid: string) {
  if (!subject || !stage || !qid) return;

  const data = read();
  if (!data[subject]) data[subject] = {};
  if (!data[subject][stage]) data[subject][stage] = [];

  const list = data[subject][stage];
  if (!list.includes(qid)) list.push(qid);

  write(data);
}

/** ✅ 取得錯題本快照（給 wrong-client.tsx 用） */
export function getWrongBookSnapshot(): WrongBookSnapshot {
  return read();
}

/** 可选：移除某一題 */
export function removeWrongQuestion(subject: string, stage: string, qid: string) {
  const data = read();
  const list = data?.[subject]?.[stage];
  if (!list) return;

  const next = list.filter((x) => x !== qid);
  data[subject][stage] = next;

  // 清空桶：保持干净
  if (data[subject][stage].length === 0) delete data[subject][stage];
  if (Object.keys(data[subject]).length === 0) delete data[subject];

  write(data);
}

/** 可选：清空全部錯題 */
export function clearWrongBook() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}