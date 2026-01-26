// lib/wrong-book.ts
// ✅ v3-3：錯題本資料層（依 subject -> stage 分組，避免互相覆蓋）
//
// 存到 localStorage：
// wrongBook:v1 = {
//   [subject]: {
//     [stage]: string[]  // qid list (dedupe)
//   }
// }
//
// 注意：此檔只能在 Client 用（有 window/localStorage 時才有資料）

export type WrongBook = Record<string, Record<string, string[]>>;

const STORAGE_KEY = "wrongBook:v1";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeJsonParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function readWrongBook(): WrongBook {
  if (!isBrowser()) return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  return safeJsonParse<WrongBook>(raw, {});
}

export function writeWrongBook(book: WrongBook) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
}

function dedupePush(list: string[], id: string) {
  if (!id) return list;
  if (list.includes(id)) return list;
  return [...list, id];
}

export function addWrongId(subject: string, stage: string, qid: string) {
  if (!isBrowser()) return;

  const s = (subject ?? "").trim() || "未分類";
  const st = (stage ?? "").trim() || "未分段";
  const id = (qid ?? "").trim();
  if (!id) return;

  const book = readWrongBook();

  const subjectMap = book[s] ?? {};
  const stageList = subjectMap[st] ?? [];

  const nextStageList = dedupePush(stageList, id);

  const next: WrongBook = {
    ...book,
    [s]: {
      ...subjectMap,
      [st]: nextStageList,
    },
  };

  writeWrongBook(next);
}

export function removeWrongId(subject: string, stage: string, qid: string) {
  if (!isBrowser()) return;

  const s = (subject ?? "").trim() || "未分類";
  const st = (stage ?? "").trim() || "未分段";
  const id = (qid ?? "").trim();
  if (!id) return;

  const book = readWrongBook();
  const subjectMap = book[s];
  if (!subjectMap) return;

  const list = subjectMap[st];
  if (!list || list.length === 0) return;

  const nextList = list.filter((x) => x !== id);
  const nextSubjectMap = { ...subjectMap, [st]: nextList };

  // 若該 stage 已空，可選擇保留或刪掉（這裡選擇保留空陣列，方便顯示 0 題）
  const next: WrongBook = {
    ...book,
    [s]: nextSubjectMap,
  };

  writeWrongBook(next);
}

export function clearWrongBook() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}

export function clearWrongBookBySubject(subject: string) {
  if (!isBrowser()) return;

  const s = (subject ?? "").trim();
  if (!s) return;

  const book = readWrongBook();
  if (!book[s]) return;

  const next = { ...book };
  delete next[s];
  writeWrongBook(next);
}

// ======================
// 工具函数（给 UI 用）
// ======================

export function getWrongStats() {
  const book = readWrongBook();
  const result: {
    subject: string;
    stage: string;
    count: number;
    qids: string[];
  }[] = [];

  Object.entries(book).forEach(([subject, stages]) => {
    Object.entries(stages).forEach(([stage, qids]) => {
      result.push({
        subject,
        stage,
        count: qids.length,
        qids: [...qids],
      });
    });
  });

  return result;
}

export function hasAnyWrong(): boolean {
  const book = readWrongBook();
  return Object.values(book).some((stages) =>
    Object.values(stages).some((list) => list.length > 0)
  );
}

// ======================
// SessionClient 需要的 API（名稱要對齊 import）
// ======================

export function addWrongQuestion(subject: string, stage: string, qid: string) {
  // 这里直接复用你现有的 addWrong / pushWrong 的逻辑：
  // 如果你文件里已有 addWrong / addWrongQid 之类函数，就在这里调用它
  // 但为避免你现在命名不一致，我这里写成“自包含版”

  const book = readWrongBook();

  if (!book[subject]) book[subject] = {};
  if (!book[subject][stage]) book[subject][stage] = [];

  // 去重
  if (!book[subject][stage].includes(qid)) {
    book[subject][stage].push(qid);
  }

  writeWrongBook(book);
}