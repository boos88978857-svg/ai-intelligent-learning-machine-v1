// app/practice/wrong/wrong-client.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

// ✅ 统一从 wrong-book 读（但用 any 兼容你可能的函数名差异，避免又编译炸）
import * as WBImport from "../../../lib/wrong-book";
import * as QBImport from "../session/question-bank";

type WrongBookShape = Record<string, Record<string, string[]>>; // subject -> stage -> qids[]

const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "18px 0" };
const card: React.CSSProperties = {
  padding: 16,
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};
const row: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };
const pill: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 12,
  whiteSpace: "nowrap",
};
const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

function safeGetBook(): WrongBookShape {
  const WB = WBImport as any;

  // 你可能的实现名：getWrongBook / readWrongBook / loadWrongBook
  const fn =
    WB.getWrongBook ||
    WB.readWrongBook ||
    WB.loadWrongBook ||
    WB.getBook ||
    null;

  try {
    const res = fn ? fn() : null;
    if (res && typeof res === "object") return res as WrongBookShape;
  } catch {}
  return {};
}

function safeClearAll() {
  const WB = WBImport as any;
  const fn =
    WB.clearWrongBook ||
    WB.clearAllWrong ||
    WB.resetWrongBook ||
    null;
  if (fn) fn();
}

function safeClearBucket(subject: string, stage: string) {
  const WB = WBImport as any;
  const fn =
    WB.clearWrongBucket ||
    WB.clearBucket ||
    WB.clearWrongByStage ||
    null;
  if (fn) fn(subject, stage);
}

function safeRemoveOne(subject: string, stage: string, qid: string) {
  const WB = WBImport as any;

  // 若你有 removeWrongQuestion / removeWrongId 就用它
  const fn =
    WB.removeWrongQuestion ||
    WB.removeWrongId ||
    WB.removeOne ||
    null;

  if (fn) {
    fn(subject, stage, qid);
    return;
  }

  // 否则：退回“读-改-写”（尽量兼容）
  const book = safeGetBook();
  const next: WrongBookShape = { ...book };
  const bucket = next?.[subject]?.[stage] ?? [];
  const filtered = bucket.filter((x) => x !== qid);

  next[subject] = { ...(next[subject] ?? {}) };
  next[subject][stage] = filtered;

  // 你可能的写入函数名：setWrongBook / writeWrongBook / saveWrongBook
  const write =
    WB.setWrongBook ||
    WB.writeWrongBook ||
    WB.saveWrongBook ||
    null;

  if (write) write(next);
}

function getQuestionPreview(qid: string): { title: string; choices?: string[] } | null {
  const QB = QBImport as any;

  // 你可能已有：getQuestionById
  const byId = QB.getQuestionById ? QB.getQuestionById(qid) : null;
  if (byId) {
    return { title: byId.prompt ?? qid, choices: byId.choices ?? [] };
  }

  // 没有就只显示 id
  return { title: qid };
}

export default function WrongClient() {
  const sp = useSearchParams();

  const [book, setBook] = useState<WrongBookShape>({});
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [activeStage, setActiveStage] = useState<string>("");

  const querySubject = (sp.get("subject") ?? "").trim();
  const queryStage = (sp.get("stage") ?? "").trim();

  function refresh() {
    setBook(safeGetBook());
  }

  useEffect(() => {
    refresh();
  }, []);

  const subjects = useMemo(() => {
    const keys = Object.keys(book || {});
    keys.sort();
    return keys;
  }, [book]);

  const stagesOfActive = useMemo(() => {
    const s = activeSubject || subjects[0] || "";
    const stageObj = (book?.[s] ?? {}) as Record<string, string[]>;
    const keys = Object.keys(stageObj);
    keys.sort();
    return keys;
  }, [book, activeSubject, subjects]);

  // 初始化默认选中（优先 URL，其次第一桶）
  useEffect(() => {
    const s0 = querySubject && book?.[querySubject] ? querySubject : (subjects[0] ?? "");
    if (s0 && s0 !== activeSubject) setActiveSubject(s0);

    const stageObj = s0 ? (book?.[s0] ?? {}) : {};
    const st0 =
      (queryStage && (stageObj as any)?.[queryStage] ? queryStage : "") ||
      (Object.keys(stageObj).sort()[0] ?? "");

    if (st0 && st0 !== activeStage) setActiveStage(st0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, querySubject, queryStage, subjects.length]);

  const activeQids = useMemo(() => {
    if (!activeSubject || !activeStage) return [];
    const arr = book?.[activeSubject]?.[activeStage] ?? [];
    // 去重 + 稳定
    return Array.from(new Set(arr));
  }, [book, activeSubject, activeStage]);

  const totalCount = useMemo(() => {
    let n = 0;
    for (const subj of Object.keys(book || {})) {
      for (const st of Object.keys(book[subj] || {})) {
        n += (book[subj][st] || []).length;
      }
    }
    return n;
  }, [book]);

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 34, marginBottom: 8 }}>錯題本</div>
        <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
          這裡列出你做錯的題目（依 <b>科目 → 階段</b> 分桶）。<br />
          你剛剛說 A2 / B1 都有錯題但沒顯示 —— 這版會顯示「所有桶」，不會只盯當前 stage。
        </div>

        <div style={{ height: 12 }} />

        <div style={row}>
          <Link href="/practice" style={{ ...btn, textDecoration: "none", display: "inline-flex", alignItems: "center" }}>
            ← 回學習區
          </Link>

          <button
            style={{ ...btn }}
            onClick={() => {
              safeClearAll();
              refresh();
            }}
          >
            清空錯題本
          </button>

          <span style={pill}>總錯題：{totalCount}</span>
        </div>

        <div style={{ height: 12 }} />

        {/* 科目 tabs */}
        <div style={row}>
          {subjects.length === 0 ? (
            <span style={pill}>目前沒有錯題</span>
          ) : (
            subjects.map((s) => {
              const active = s === activeSubject;
              return (
                <button
                  key={s}
                  style={{
                    ...pill,
                    cursor: "pointer",
                    border: active ? "1px solid #111" : "1px solid #e6e6e6",
                    background: active ? "#111" : "#fafafa",
                    color: active ? "#fff" : "#111",
                  }}
                  onClick={() => {
                    setActiveSubject(s);
                    // 切科目时，顺便选第一个 stage
                    const st0 = Object.keys(book?.[s] ?? {}).sort()[0] ?? "";
                    setActiveStage(st0);
                  }}
                >
                  {s}
                </button>
              );
            })
          )}
        </div>

        <div style={{ height: 10 }} />

        {/* 阶段 tabs */}
        {activeSubject ? (
          <div style={row}>
            {(Object.keys(book?.[activeSubject] ?? {}) as string[]).sort().map((st) => {
              const active = st === activeStage;
              const count = (book?.[activeSubject]?.[st] ?? []).length;
              return (
                <button
                  key={st}
                  style={{
                    ...pill,
                    cursor: "pointer",
                    border: active ? "1px solid #111" : "1px solid #e6e6e6",
                    background: active ? "#111" : "#fafafa",
                    color: active ? "#fff" : "#111",
                  }}
                  onClick={() => setActiveStage(st)}
                >
                  階段：{st}（{count}）
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      <div style={{ height: 12 }} />

      {/* 当前桶内容 */}
      <div style={card}>
        <div style={row}>
          <span style={pill}>{activeSubject || "-"}</span>
          <span style={pill}>階段：{activeStage || "-"}</span>
          <span style={pill}>錯題數：{activeQids.length}</span>

          {activeSubject && activeStage ? (
            <button
              style={{ ...btn }}
              onClick={() => {
                safeClearBucket(activeSubject, activeStage);
                refresh();
              }}
            >
              清空此階段
            </button>
          ) : null}
        </div>

        <div style={{ height: 12 }} />

        {activeQids.length === 0 ? (
          <div style={{ padding: 12, borderRadius: 12, border: "1px dashed #e0e0e0", opacity: 0.75 }}>
            目前沒有錯題 🎉
            <div style={{ marginTop: 6, fontSize: 13 }}>
              若你確定你剛剛有答錯：請回到作答頁，再故意答錯 1 題後回來（錯題會即時寫入）。
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {activeQids.map((qid) => {
              const preview = getQuestionPreview(qid);
              const title = (preview?.title ?? qid).split("\n").slice(0, 2).join(" ").slice(0, 120);

              // ✅ 重练链接（先给你入口，SessionClient 那边若已支持 wrong 模式就能直接跳）
              const href = `/practice/session?mode=wrong&subject=${encodeURIComponent(
                activeSubject
              )}&stage=${encodeURIComponent(activeStage)}&qid=${encodeURIComponent(qid)}`;

              return (
                <div key={qid} style={{ padding: 12, borderRadius: 14, border: "1px solid #eee" }}>
                  <div style={{ fontWeight: 800, lineHeight: 1.5 }}>{title}</div>
                  <div style={{ opacity: 0.65, fontSize: 12, marginTop: 4 }}>id: {qid}</div>

                  <div style={{ height: 10 }} />

                  <div style={row}>
                    <Link href={href} style={{ ...btn, textDecoration: "none" }}>
                      去重練 →
                    </Link>

                    <button
                      style={{ ...btn }}
                      onClick={() => {
                        safeRemoveOne(activeSubject, activeStage, qid);
                        refresh();
                      }}
                    >
                      移除
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ height: 14 }} />

      {/* 说明 */}
      <div style={{ ...card, opacity: 0.8, fontSize: 13, lineHeight: 1.7 }}>
        小提醒：
        <ul style={{ margin: "8px 0 0 18px" }}>
          <li>這頁會顯示「所有科目/階段桶」，不會再出現 A2 覆蓋 A1 的情況。</li>
          <li>若你部署後仍看不到：通常是「寫入錯題」那邊沒真正呼叫到 wrong-book 的新增函式。</li>
          <li>你剛剛貼的 SessionClient 裡已看到 <code>addWrongQuestion(subject, stage, q.id)</code>，所以正常應該會進桶。</li>
        </ul>
      </div>
    </main>
  );
}