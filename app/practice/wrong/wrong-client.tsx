// app/practice/wrong/wrong-client.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { 取得目前進度id, 讀取進度, type PracticeSession } from "../../lib/session";
import { getQuestionById, type Question } from "../practice/session/question-bank";

const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "8px 0" };

const card: React.CSSProperties = {
  padding: "14px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
};

const pill: React.CSSProperties = {
  padding: "4px 8px",
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

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

type WrongItem = {
  id: string;
  subject: string;
  stage: string;
  q: Question | null;
};

export default function WrongClient() {
  const router = useRouter();
  const [session, setSession] = useState<PracticeSession | null>(null);

  // 讀取目前進度（沿用你現有邏輯：localStorage 裡的目前 id）
  useEffect(() => {
    const id = 取得目前進度id();
    if (!id) {
      setSession(null);
      return;
    }
    const s = 讀取進度(id);
    setSession(s ?? null);
  }, []);

  // 從 session 裡讀錯題 ids（兼容：wrongQuestionIds / wrongIds）
  const wrongIds = useMemo(() => {
    const s: any = session as any;
    const arr = (s?.wrongQuestionIds ?? s?.wrongIds ?? []) as string[];
    // 去重 + 保持順序
    const seen = new Set<string>();
    const out: string[] = [];
    for (const id of arr) {
      if (!id) continue;
      if (seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
    return out;
  }, [session]);

  // 組裝展示資料（題目查詢靠 getQuestionById）
  const items = useMemo<WrongItem[]>(() => {
    const s: any = session as any;
    const subject = (s?.subject ?? "") as string;
    const stage = (s?.stage ?? "") as string;

    return wrongIds.map((id) => ({
      id,
      subject,
      stage,
      q: getQuestionById(id),
    }));
  }, [wrongIds, session]);

  function back() {
    router.replace("/practice");
  }

  function retryOne(id: string) {
    // 先用最穩定方式：跳回 session 頁（沿用你現在 session 的 id）
    // 下一步 v3-3 step2 我們再做「只練錯題」的 session 模式
    router.replace("/practice/session");
  }

  return (
    <main style={wrap}>
      <div style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 22 }}>錯題本</div>
        <button style={btn} onClick={back}>
          ← 回學習區
        </button>
      </div>

      <div style={{ height: 10 }} />

      {!session ? (
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>尚未找到進度</div>
          <div style={{ opacity: 0.75, fontSize: 13 }}>請先進入一次作答頁，系統才會記錄錯題。</div>
        </div>
      ) : wrongIds.length === 0 ? (
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>目前沒有錯題 🎉</div>
          <div style={{ opacity: 0.75, fontSize: 13 }}>當你答錯時，題目 id 會被記到錯題本。</div>
        </div>
      ) : (
        <>
          <div style={card}>
            <div style={row}>
              <span style={pill}>科目：{(session as any).subject ?? "-"}</span>
              <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
              <span style={pill}>錯題數：{wrongIds.length}</span>
            </div>
            <div style={{ marginTop: 10, opacity: 0.75, fontSize: 13 }}>
              先做「列表確認」：能看到錯題題目 + 正解。下一步再做「點進去只練錯題」。
            </div>
          </div>

          <div style={{ height: 10 }} />

          {items.map((it) => (
            <div key={it.id} style={{ ...card, marginBottom: 10 }}>
              <div style={{ ...row, justifyContent: "space-between" }}>
                <div style={row}>
                  <span style={pill}>ID：{it.id}</span>
                </div>
                <button style={btnPrimary} onClick={() => retryOne(it.id)}>
                  去重練 →
                </button>
              </div>

              <div style={{ height: 10 }} />

              {it.q ? (
                <>
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>題目</div>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{it.q.prompt}</div>

                  <div style={{ height: 10 }} />

                  <div style={{ fontWeight: 800, marginBottom: 6 }}>選項</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {(it.q.choices ?? []).map((c) => (
                      <div
                        key={c}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid #ddd",
                          background: c === it.q!.answer ? "#f0fff4" : "#fff",
                        }}
                      >
                        {c}
                        {c === it.q!.answer ? <span style={{ marginLeft: 8 }}>✅ 正解</span> : null}
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ opacity: 0.75 }}>
                  找不到題目資料（可能題庫沒有這個 id，或你題庫 id 有變）。ID：{it.id}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </main>
  );
}