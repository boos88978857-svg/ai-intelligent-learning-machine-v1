// lib/wrong-book.ts
"use client";

export type WrongBookSnapshot = Record<string, Record<string, string[]>>;
// 结构：{ [subject]: { [stage]: [qid, qid, ...] } }

const STORAGE_KEY = "wrongBook.v1";
const EVENT_NAME = "wrongbook:updated";

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

function notifyUpdated() {
  if (typeof window === "undefined") return;
  // 同一個 tab 內 localStorage 更新不會觸發 storage event，所以我們自己派事件
  window.dispatchEvent(new Event(EVENT_NAME));
}

function write(data: WrongBookSnapshot) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notifyUpdated();
}

/** ✅ 监听错题本更新（同 tab / 跨 tab 都能更新） */
export function onWrongBookUpdated(cb: () => void) {
  if (typeof window === "undefined") return () => {};

  const handler = () => cb();

  // 同 tab：自定义事件
  window.addEventListener(EVENT_NAME, handler);

  // 跨 tab：storage 事件
  const storageHandler = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("storage", storageHandler);

  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    window.removeEventListener("storage", storageHandler);
  };
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

/** ✅ 取得錯題本快照（給 wrong-client.tsx / wrong-session-client.tsx 用） */
export function getWrongBookSnapshot(): WrongBookSnapshot {
  return read();
}

/** ✅ 移除某一題 */
export function removeWrongQuestion(subject: string, stage: string, qid: string) {
  if (!subject || !stage || !qid) return;

  const data = read();
  const list = data?.[subject]?.[stage];
  if (!list) return;

  const next = list.filter((x) => x !== qid);
  if (next.length > 0) {
    data[subject][stage] = next;
  } else {
    delete data[subject][stage];
    if (Object.keys(data[subject]).length === 0) delete data[subject];
  }

  write(data);
}

/** ✅ 清空全部錯題 */
export function clearWrongBook() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  notifyUpdated();
}