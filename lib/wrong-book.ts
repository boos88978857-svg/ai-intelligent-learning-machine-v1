// lib/wrong-book.ts
// ✅ v3-3：錯題本（依「科目 -> 階段」分桶）
// localStorage 儲存結構：
// {
//   version: 1,
//   buckets: {
//     "<subject>|||<stage>": {
//        subject: "英文",
//        stage: "A1",
//        qids: ["en-a1-01", ...],
//        updatedAt: 1700000000000
//     },
//     ...
//   }
// }

export type WrongBucket = {
  subject: string;
  stage: string;
  qids: string[];
  updatedAt: number;
};

type Store = {
  version: 1;
  buckets: Record<string, WrongBucket>;
};

const KEY = "__PRACTICE_WRONG_BOOK_V1__";

function safeNow() {
  return Date.now();
}

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function makeBucketKey(subject: string, stage: string) {
  return `${String(subject)}|||${String(stage)}`;
}

function readStore(): Store {
  if (!isBrowser()) return { version: 1, buckets: {} };

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { version: 1, buckets: {} };

    const parsed = JSON.parse(raw) as Partial<Store>;
    if (!parsed || parsed.version !== 1 || !parsed.buckets) return { version: 1, buckets: {} };

    // 基本防呆
    const buckets: Record<string, WrongBucket> = {};
    for (const k of Object.keys(parsed.buckets)) {
      const b = (parsed.buckets as any)[k] as WrongBucket;
      if (!b || !b.subject || !b.stage || !Array.isArray(b.qids)) continue;
      buckets[k] = {
        subject: String(b.subject),
        stage: String(b.stage),
        qids: Array.from(new Set(b.qids.map((x) => String(x)))),
        updatedAt: Number(b.updatedAt ?? safeNow()),
      };
    }

    return { version: 1, buckets };
  } catch {
    return { version: 1, buckets: {} };
  }
}

function writeStore(store: Store) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

/** ✅ 新增一題錯題（依 subject/stage 分桶；同題不重複） */
export function addWrongQuestion(subject: string, stage: string, qid: string) {
  if (!isBrowser()) return;

  const s = readStore();
  const key = makeBucketKey(subject, stage);

  const prev = s.buckets[key] ?? {
    subject,
    stage,
    qids: [],
    updatedAt: safeNow(),
  };

  const set = new Set(prev.qids);
  set.add(String(qid));

  s.buckets[key] = {
    subject: prev.subject,
    stage: prev.stage,
    qids: Array.from(set),
    updatedAt: safeNow(),
  };

  writeStore(s);
}

/** 取得某分桶（科目+階段）的錯題列表 */
export function getWrongBucket(subject: string, stage: string): WrongBucket {
  const s = readStore();
  const key = makeBucketKey(subject, stage);
  return (
    s.buckets[key] ?? {
      subject,
      stage,
      qids: [],
      updatedAt: 0,
    }
  );
}

/** ✅ 列出全部分桶摘要：[{subject, stage, count, updatedAt}] */
export function listWrongSummary(): Array<{
  subject: string;
  stage: string;
  count: number;
  updatedAt: number;
}> {
  const s = readStore();
  const out: Array<{ subject: string; stage: string; count: number; updatedAt: number }> = [];

  for (const k of Object.keys(s.buckets)) {
    const b = s.buckets[k];
    out.push({
      subject: b.subject,
      stage: b.stage,
      count: b.qids.length,
      updatedAt: b.updatedAt,
    });
  }

  // 最新的放前面
  out.sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
  return out;
}

/** 移除某分桶中的某題 */
export function removeWrongQuestion(subject: string, stage: string, qid: string) {
  if (!isBrowser()) return;

  const s = readStore();
  const key = makeBucketKey(subject, stage);
  const b = s.buckets[key];
  if (!b) return;

  const next = b.qids.filter((x) => x !== String(qid));
  s.buckets[key] = { ...b, qids: next, updatedAt: safeNow() };

  writeStore(s);
}

/** 清空某分桶 */
export function clearWrongBucket(subject: string, stage: string) {
  if (!isBrowser()) return;

  const s = readStore();
  const key = makeBucketKey(subject, stage);
  delete s.buckets[key];
  writeStore(s);
}

/** 清空全部錯題本 */
export function clearAllWrongBook() {
  if (!isBrowser()) return;
  writeStore({ version: 1, buckets: {} });
}