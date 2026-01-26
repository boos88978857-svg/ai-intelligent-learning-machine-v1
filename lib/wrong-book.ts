// lib/wrong-book.ts
// v3-3：錯題本（依 科目 -> 階段 分桶）
// 存在 localStorage：wrongBook.v1

export type WrongBook = Record<string, Record<string, string[]>>;

const KEY = "wrongBook.v1";

function safeParse(json: string | null): WrongBook {
  if (!json) return {};
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return {};
    return obj as WrongBook;
  } catch {
    return {};
  }
}

export function readWrongBook(): WrongBook {
  if (typeof window === "undefined") return {};
  return safeParse(window.localStorage.getItem(KEY));
}

export function writeWrongBook(book: WrongBook) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(book));
}

// ✅ 你 SessionClient.tsx 用的就是這個名字：addWrongQuestion
export function addWrongQuestion(subject: string, stage: string, qid: string) {
  if (typeof window === "undefined") return;

  const book = readWrongBook();
  const s = subject || "未知科目";
  const st = stage || "未知階段";

  const bucket = book[s] ?? {};
  const ids = bucket[st] ?? [];

  // 去重：同一題只記一次
  if (!ids.includes(qid)) ids.push(qid);

  bucket[st] = ids;
  book[s] = bucket;

  writeWrongBook(book);
}

export function clearWrongBookAll() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}

export function clearWrongBookBucket(subject: string, stage: string) {
  if (typeof window === "undefined") return;

  const book = readWrongBook();
  if (!book[subject]) return;
  if (!book[subject][stage]) return;

  delete book[subject][stage];
  // 如果該科目已沒有任何階段，清掉科目 key
  if (Object.keys(book[subject]).length === 0) delete book[subject];

  writeWrongBook(book);
}

// 讓 UI 好用：列出所有桶（subject/stage/ids）
export function listWrongBuckets(): Array<{ subject: string; stage: string; ids: string[] }> {
  const book = readWrongBook();
  const out: Array<{ subject: string; stage: string; ids: string[] }> = [];

  for (const subject of Object.keys(book)) {
    const stages = book[subject] ?? {};
    for (const stage of Object.keys(stages)) {
      const ids = stages[stage] ?? [];
      if (ids.length > 0) out.push({ subject, stage, ids });
    }
  }

  // 穩定排序：subject 再 stage
  out.sort((a, b) => (a.subject + a.stage).localeCompare(b.subject + b.stage, "zh-Hant"));
  return out;
}