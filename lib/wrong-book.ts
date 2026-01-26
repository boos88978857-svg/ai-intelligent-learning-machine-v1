// lib/wrong-book.ts
// ✅ 錯題本（依 科目 -> 階段 分桶），避免 A1 被 A2 覆蓋、不同科目混在一起

export type WrongStageBucket = {
  qids: string[]; // 題目 id 清單（去重）
};

export type WrongBook = {
  [subject: string]: {
    [stage: string]: WrongStageBucket;
  };
};

const STORAGE_KEY = "wrongBook.v1";

/** ====== 基礎工具 ====== */
function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function safeParse(json: string | null): any {
  if (!json) return null;
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function normalizeKey(s: string) {
  return (s ?? "").trim();
}

function ensureBookShape(raw: any): WrongBook {
  // 容錯：確保一定回傳 object
  if (!raw || typeof raw !== "object") return {};
  return raw as WrongBook;
}

export function getWrongBook(): WrongBook {
  if (!isBrowser()) return {};
  const raw = safeParse(localStorage.getItem(STORAGE_KEY));
  return ensureBookShape(raw);
}

export function setWrongBook(book: WrongBook) {
  if (!isBrowser()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
}

/** ====== 寫入 / 追加 ====== */
export function addWrongQuestion(subject: string, stage: string, qid: string) {
  const subj = normalizeKey(subject);
  const stg = normalizeKey(stage);
  const id = normalizeKey(qid);
  if (!subj || !stg || !id) return;

  const book = getWrongBook();
  if (!book[subj]) book[subj] = {};
  if (!book[subj][stg]) book[subj][stg] = { qids: [] };

  // 去重追加（保持穩定）
  const list = book[subj][stg].qids;
  if (!list.includes(id)) list.push(id);

  setWrongBook(book);
}

/** ====== 讀取：科目 / 階段 / 題目 ====== */
export function getWrongSubjects(): string[] {
  const book = getWrongBook();
  return Object.keys(book);
}

export function getWrongStages(subject: string): string[] {
  const subj = normalizeKey(subject);
  const book = getWrongBook();
  const bucket = book[subj];
  if (!bucket) return [];
  return Object.keys(bucket);
}

export function getWrongQids(subject: string, stage: string): string[] {
  const subj = normalizeKey(subject);
  const stg = normalizeKey(stage);
  const book = getWrongBook();
  const bucket = book[subj]?.[stg];
  if (!bucket) return [];
  return Array.isArray(bucket.qids) ? bucket.qids : [];
}

export function getWrongCount(subject: string, stage: string): number {
  return getWrongQids(subject, stage).length;
}

/** ====== 清除 ====== */
export function clearWrongStage(subject: string, stage: string) {
  const subj = normalizeKey(subject);
  const stg = normalizeKey(stage);
  const book = getWrongBook();
  if (!book[subj] || !book[subj][stg]) return;

  delete book[subj][stg];
  // 若科目底下已無任何階段，就把科目也刪掉
  if (Object.keys(book[subj]).length === 0) {
    delete book[subj];
  }
  setWrongBook(book);
}

export function clearWrongSubject(subject: string) {
  const subj = normalizeKey(subject);
  const book = getWrongBook();
  if (!book[subj]) return;
  delete book[subj];
  setWrongBook(book);
}

export function clearAllWrongBook() {
  if (!isBrowser()) return;
  localStorage.removeItem(STORAGE_KEY);
}

/** ====== Debug（可選） ====== */
export function dumpWrongBookToConsole() {
  // 方便你在瀏覽器 console 看現在到底存了什麼
  // eslint-disable-next-line no-console
  console.log("[wrong-book]", getWrongBook());
}