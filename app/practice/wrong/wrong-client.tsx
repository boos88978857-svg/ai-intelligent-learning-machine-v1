"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  取得目前進度id,
  設定目前進度id,
  讀取進度,
  寫入進度,
  type PracticeSession,
} from "../../../lib/session";

import { getQuestionById, type Question } from "../session/question-bank";

const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "12px 14px" };

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };

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
  qid: string;
  q: Question | null;
};

function getWrongIdsFromSession(s: PracticeSession | any): string[] {
  // 兼容不同命名
  const ids =
    s?.wrongQuestionIds ||
    s?.wrongIds ||
    s?.wrongQids ||
    s?.wrongQuestions ||
    s?.錯題ids ||
    s?.錯題 ||
    [];

  return Array.isArray(ids) ? ids.filter((x) => typeof x === "string") : [];
}

export default function WrongClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  useEffect(() => {
    const idFromUrl = sp.get("id");
    const id = idFromUrl || 取得目前進度id();

    if (!id) {
      router.replace("/practice");
      return;
    }

    設定目前進度id(id);
    const s = 讀取進度(id);

    if (!s) {
      router.replace("/practice");
      return;
    }

    setSession(s);
  }, [router, sp]);

  const wrongIds = useMemo(() => {
    if (!session) return [];
    return getWrongIdsFromSession(session);
  }, [session]);

  const items: WrongItem[] = useMemo(() => {
    return wrongIds.map((qid) => ({ qid, q: getQuestionById(qid) }));
  }, [wrongIds]);

  function backToPractice() {
    router.replace("/practice");
  }

  function clearWrongBook() {
    if (!session) return;

    // 清错题本（不动对错统计）
    const next: any = { ...session };
    if ("wrongQuestionIds" in next) next.wrongQuestionIds = [];
    else next.wrongQuestionIds = [];

    寫入進度(next);
    setSession(next);
  }

  function retryQuestion(qid: string) {
    if (!session) return;
    // 跳回作答页，用 query 带回要重练的题目 id（后续 SessionClient 再吃这个参数）
    router.replace(`/practice/session?id=${encodeURIComponent(session.id)}&retry=${encodeURIComponent(qid)}`);
  }

  if (!session) {
    return (
      <main style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 900 }}>讀取中…</div>
          <div style={{ opacity: 0.7, marginTop: 8 }}>若一直停在這裡，請回到學習區重新進入。</div>
        </div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, fontSize: 26 }}>錯題本</div>
            <div style={{ opacity: 0.75, marginTop: 6, lineHeight: 1.7 }}>
              這裡列出你本回合做錯的題目（之後會再加「錯題重練模式」流程）。
            </div>
          </div>

          <div style={row}>
            <button style={btn} onClick={backToPractice}>
              ← 回學習區
            </button>
            <button style={btn} onClick={clearWrongBook}>
              清空錯題本
            </button>
          </div>
        </div>

        <div style={{ height: 10 }} />

        <div style={row}>
          <span style={pill}>{session.subject}</span>
          <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
          <span style={pill}>錯題數：{wrongIds.length}</span>
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div style={card}>
        {wrongIds.length === 0 ? (
          <div style={{ opacity: 0.75, lineHeight: 1.8 }}>目前沒有錯題 🎉</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {items.map(({ qid, q }) => (
              <div key={qid} style={{ padding: 12, borderRadius: 14, border: "1px solid #eee" }}>
                <div style={{ ...row, justifyContent: "space-between" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 900, marginBottom: 6 }}>
                      {q ? q.prompt.split("\n")[0] : "（題目找不到，可能題庫已更新）"}
                    </div>
                    <div style={{ opacity: 0.75, whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
                      {q ? q.prompt : `QuestionId: ${qid}`}
                    </div>
                  </div>

                  <div style={row}>
                    <button style={btnPrimary} onClick={() => retryQuestion(qid)}>
                      重練
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}