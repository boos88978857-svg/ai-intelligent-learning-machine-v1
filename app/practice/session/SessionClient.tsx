// app/practice/session/SessionClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Question, 取一回合 } from "../../../lib/questions";
import Whiteboard from "../../components/Whiteboard";

import {
  取得目前進度id,
  設定目前進度id,
  讀取進度,
  寫入進度,
  刪除進度,
  新增進度,
  格式化時間,
  type PracticeSession,
  type Subject,
} from "../../../lib/session";

/* ================== 樣式 ================== */
const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "8px 0" };
const card: React.CSSProperties = {
  padding: "14px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 13,
};
const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
};
const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);
const [questions, setQuestions] = useState<Question[]>([]);
  /* ===== UI 狀態 ===== */
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  /* ✅ Step 2-2（1/2）：作答 state（只新增，不影響原本功能） */
  const [textAnswer, setTextAnswer] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);

  const timerRef = useRef<number | null>(null);

  /* ===== 讀取進度 ===== */
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
    setHintText(null);
    setMsg(null);
  }, [router, sp]);

  /* ===== 計時 ===== */
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;

    if (session.paused) return;

    timerRef.current = window.setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = { ...prev, elapsedSec: prev.elapsedSec + 1 };
        寫入進度(next);
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [session?.id, session?.paused]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return session.hintUsed < session.hintLimit;
  }, [session]);

  function togglePause() {
    if (!session) return;
    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);
  }

  function onHint() {
    if (!session) return;
    if (!canHint) {
      setHintText("提示次數已用完");
      return;
    }
    const next = { ...session, hintUsed: session.hintUsed + 1 };
    寫入進度(next);
    setSession(next);
    setHintText("提示：請先找出題目的關鍵字，再思考解法。");
  }

  if (!session) {
    return (
      <main style={wrap}>
        <div style={card}>讀取中…</div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      {/* ===== 頂部狀態 ===== */}
      <div style={card}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div style={row}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>第 {session.currentIndex + 1} 題</span>
            <span style={pill}>⏱ {格式化時間(session.elapsedSec)}</span>
            <span style={pill}>對：{session.correctCount} / 錯：{session.wrongCount}</span>
            <span style={pill}>提示：{session.hintUsed}/{session.hintLimit}</span>
          </div>

          <div style={row}>
            <button onClick={togglePause} style={btn}>
              {session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>
            <button onClick={() => router.replace("/practice")} style={btn}>
              ← 回上一頁
            </button>
          </div>
        </div>

        {session.paused ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff8e6" }}>
            已暫停；按「繼續」後再作答。
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>提示</div>

        <div style={row}>
          <button onClick={onHint} disabled={!canHint} style={{ ...btn, opacity: canHint ? 1 : 0.5 }}>
            顯示提示
          </button>

          <button style={btn} onClick={() => setWhiteboardOpen(true)}>
            📝 涂鴉牆
          </button>
        </div>

        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px dashed #e0e0e0" }}>
          {hintText ? (
            <div style={{ lineHeight: 1.8 }}>{hintText}</div>
          ) : (
            <div style={{ opacity: 0.7, lineHeight: 1.8 }}>
              點「顯示提示」後會顯示提示內容（答對前會停留）。
            </div>
          )}
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 作答區（Step 2：先能輸入，不判斷對錯）===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>作答區（Step 2）</div>

        <div
          style={{
            padding: 12,
            borderRadius: 14,
            border: "1px solid #e6e6e6",
            background: "#fafafa",
            lineHeight: 1.7,
          }}
        >
          題目（暫用測試）：2 + 3 = ?
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            placeholder="請輸入答案（暫不判斷）"
            style={{
              flex: "1 1 220px",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              fontSize: 16,
              outline: "none",
              background: "#fff",
            }}
          />

          <button
            style={btnPrimary}
            onClick={() => {
              const value = textAnswer.trim();
              if (!value) {
                setMsg("請先輸入答案再送出。");
                return;
              }
              setSubmitted(value);
              setMsg(`你已送出答案：${value}`);
            }}
          >
            送出
          </button>

          <button
            style={btn}
            onClick={() => {
              setTextAnswer("");
              setSubmitted(null);
              setMsg(null);
            }}
          >
            清除
          </button>
        </div>

        {submitted ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>
            目前送出：{submitted}
          </div>
        ) : null}

        {msg ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>
            {msg}
          </div>
        ) : null}
      </div>

      {/* ✅ Whiteboard 本體：放在 </main> 之前 */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}