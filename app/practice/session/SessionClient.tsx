// app/practice/session/SessionClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

/* ================= 基本樣式 ================= */
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
  padding: "8px 12px",
  borderRadius: 10,
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

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // 行為鎖定
  const [answered, setAnswered] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  const timerRef = useRef<number | null>(null);

  /* ================= 讀取進度 ================= */
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
    setAnswered(false);
    setMsg(null);
    setHintText(null);
  }, [router, sp]);

  /* ================= 計時（未暫停才跑） ================= */
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

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
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session?.id, session?.paused]);

  /* ================= 狀態判斷 ================= */
  const canHint = useMemo(() => {
    if (!session) return false;
    return session.hintUsed < session.hintLimit;
  }, [session]);

  const canAnswer = !!session && !session.paused && !answered;
  const canNext = !!session && answered && !session.paused;

  /* ================= 操作 ================= */
  function togglePause() {
    if (!session) return;
    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);
  }

  function onHint() {
    if (!session || !canHint) return;

    const next = { ...session, hintUsed: session.hintUsed + 1 };
    寫入進度(next);
    setSession(next);
    setHintText("提示：先找關鍵字，再判斷或計算。");
  }

  function markCorrect() {
    if (!canAnswer || !session) return;
    const next = { ...session, correctCount: session.correctCount + 1 };
    寫入進度(next);
    setSession(next);
    setAnswered(true);
    setMsg("答對了，請前往下一題。");
  }

  function markWrong() {
    if (!canAnswer || !session) return;
    const next = { ...session, wrongCount: session.wrongCount + 1 };
    寫入進度(next);
    setSession(next);
    setAnswered(true);
    setMsg("本題答錯，請前往下一題。");
  }

  function goNext() {
    if (!canNext || !session) return;
    const next = { ...session, currentIndex: session.currentIndex + 1 };
    寫入進度(next);
    setSession(next);
    setAnswered(false);
    setMsg(null);
    setHintText(null);
  }

  function backToPractice() {
    router.replace("/practice");
  }

  if (!session) {
    return (
      <main style={wrap}>
        <div style={card}>讀取中…</div>
      </main>
    );
  }

  /* ================= UI ================= */
  return (
    <main style={wrap}>
      {/* ===== 頂部 ===== */}
      <div style={card}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div style={row}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>第 {session.currentIndex + 1} 題</span>
          </div>

          <div style={row}>
            <span style={pill}>⏱ {格式化時間(session.elapsedSec)}</span>

            <button
              onClick={togglePause}
              style={{ ...pill, cursor: "pointer", background: "#fff" }}
            >
              {session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>

            <button style={btn} onClick={backToPractice}>
              ← 回上一頁
            </button>
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <span style={pill}>提示：{session.hintUsed}/{session.hintLimit}</span>
        </div>

        {session.paused && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff8e6" }}>
            已暫停；請按「繼續」後再作答。
          </div>
        )}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>提示</div>

        <div style={row}>
          <button style={btn} disabled={!canHint} onClick={onHint}>
            顯示提示
          </button>

          <button style={btn} onClick={() => setWhiteboardOpen(true)}>
            📝 塗鴉牆
          </button>
        </div>

        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: "1px dashed #e0e0e0" }}>
          {hintText || "尚未使用提示"}
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 作答區 ===== */}
      <div style={card}>
        <div style={{ ...row, justifyContent: "space-between", marginBottom: 8 }}>
          <strong>作答區（demo）</strong>
          <div style={row}>
            <span style={pill}>對：{session.correctCount}</span>
            <span style={pill}>錯：{session.wrongCount}</span>
          </div>
        </div>

        <div style={row}>
          <button style={btnPrimary} disabled={!canAnswer} onClick={markCorrect}>
            模擬答對
          </button>

          <button style={btn} disabled={!canAnswer} onClick={markWrong}>
            模擬答錯
          </button>

          <button style={btn} disabled={!canNext} onClick={goNext}>
            下一題 →
          </button>
        </div>

        {msg && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>
            {msg}
          </div>
        )}
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}