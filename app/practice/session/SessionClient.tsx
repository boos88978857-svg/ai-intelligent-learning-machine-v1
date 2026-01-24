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
  格式化時間,
  type PracticeSession,
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

const btnGhost: React.CSSProperties = {
  ...btn,
  background: "#fff",
};

/** ✅ v2-9：回上一頁固定在頂部右側（靠近關於） */
const fixedTopRightBtn: React.CSSProperties = {
  position: "fixed",
  right: 14,
  top: 74,
  zIndex: 999,
  ...btnGhost,
};

/* ================= 常數（20 題一回合） ================= */
const TOTAL_QUESTIONS = 20;

/* ================= ✅ A：狀態卡同排固定（Grid） ================= */
/** 左 1fr / 右 auto：右側(計時+暫停)永遠在同一排右上，不會掉到第二行 */
const statusGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  gap: 10,
  alignItems: "start",
};

const statusLeft: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center",
  minWidth: 0,
};

const statusRight: React.CSSProperties = {
  display: "flex",
  gap: 8,
  alignItems: "center",
  whiteSpace: "nowrap",
  justifySelf: "end",
};

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // 作答流程（先選擇 → 確定 → 2 秒後自動下一題）
  const [picked, setPicked] = useState<"correct" | "wrong" | null>(null);
  const [judging, setJudging] = useState(false);
  const nextTimerRef = useRef<number | null>(null);

  // 計時
  const timerRef = useRef<number | null>(null);

  function backToPractice() {
    router.replace("/practice");
  }

  function clearNextTimer() {
    if (nextTimerRef.current) {
      window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    }
  }

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
    setMsg(null);
    setHintText(null);

    // 重置作答流程
    setPicked(null);
    setJudging(false);
    clearNextTimer();
  }, [router, sp]);

  /* ================= 計時（僅在未暫停時） ================= */
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

  /* ================= 計算狀態 ================= */
  const canHint = useMemo(() => {
    if (!session) return false;
    return session.hintUsed < session.hintLimit;
  }, [session]);

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  }, [session]);

  const isFinished = useMemo(() => {
    return answeredCount >= TOTAL_QUESTIONS;
  }, [answeredCount]);

  const locked = useMemo(() => {
    return !session || session.paused || judging || isFinished;
  }, [session, judging, isFinished]);

  /* ================= 操作：暫停 ================= */
  function togglePause() {
    if (!session) return;
    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);
    setMsg(null);
  }

  /* ================= 操作：提示 ================= */
  function onHint() {
    if (!session) return;
    if (session.paused) return;

    if (!canHint) {
      setHintText("提示次數已用完");
      return;
    }

    const next = { ...session, hintUsed: session.hintUsed + 1 };
    寫入進度(next);
    setSession(next);

    setHintText("提示：先找關鍵字，再拆步驟，最後再判斷/計算。");
  }

  /* ================= 選答 / 確定 / 2 秒後自動下一題 ================= */
  function pickCorrect() {
    if (locked) return;
    setPicked("correct");
    setMsg(null);
  }

  function pickWrong() {
    if (locked) return;
    setPicked("wrong");
    setMsg(null);
  }

  function confirmPick() {
    if (!session) return;
    if (locked) return;

    if (!picked) {
      setMsg("請先選擇「答對/答錯」，再按「確定」。");
      return;
    }

    const next =
      picked === "correct"
        ? { ...session, correctCount: session.correctCount + 1 }
        : { ...session, wrongCount: session.wrongCount + 1 };

    寫入進度(next);
    setSession(next);

    setJudging(true);
    setMsg(picked === "correct" ? "✅ 判定：答對！2 秒後進入下一題…" : "❌ 判定：答錯！2 秒後進入下一題…");

    clearNextTimer();
    nextTimerRef.current = window.setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;

        const newAnswered = (prev.correctCount ?? 0) + (prev.wrongCount ?? 0);
        if (newAnswered >= TOTAL_QUESTIONS) return prev;

        const moved = { ...prev, currentIndex: prev.currentIndex + 1 };
        寫入進度(moved);
        return moved;
      });

      setPicked(null);
      setJudging(false);
      setHintText(null);
      setMsg(null);
    }, 2000);
  }

  useEffect(() => {
    return () => {
      clearNextTimer();
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  /* ================= 完成畫面 ================= */
  if (session && isFinished) {
    return (
      <main style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 34, display: "flex", gap: 10, alignItems: "center" }}>
            🎉 本回合完成
          </div>

          <div style={{ height: 10 }} />

          <div style={{ ...row, alignItems: "center" }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>題數：{TOTAL_QUESTIONS}/{TOTAL_QUESTIONS}</span>
            <span style={pill}>用時：{格式化時間(session.elapsedSec)}</span>
          </div>

          <div style={{ height: 8 }} />

          <div style={row}>
            <span style={pill}>答對：{session.correctCount}</span>
            <span style={pill}>答錯：{session.wrongCount}</span>
          </div>

          <div style={{ height: 12 }} />

          <button style={btnPrimary} onClick={backToPractice}>
            回學習區
          </button>
        </div>
      </main>
    );
  }

  /* ================= 空狀態 ================= */
  if (!session) {
    return (
      <main style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>讀取中…</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>若一直停在這裡，請回到學習區重新進入。</div>
        </div>
      </main>
    );
  }

  /* ================= UI ================= */
  return (
    <main style={wrap}>
      {/* 回上一頁固定在頂部（靠近「關於」右側） */}
      <button style={fixedTopRightBtn} onClick={backToPractice}>
        ← 回上一頁
      </button>

      {/* ✅ 狀態卡：用 Grid 固定同排（A） */}
      <div style={card}>
        <div style={statusGrid}>
          {/* 左側：科目/階段/題號（左欄自己可換行） */}
          <div style={statusLeft}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>第 {Math.min(session.currentIndex + 1, TOTAL_QUESTIONS)} 題</span>
          </div>

          {/* 右側：計時 + 暫停（永遠固定在同一排右上） */}
          <div style={statusRight}>
            <span style={pill}>⏱ {格式化時間(session.elapsedSec)}</span>

            <button
              onClick={togglePause}
              style={{
                ...pill,
                cursor: "pointer",
                background: "#fff",
              }}
            >
              {session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>
          </div>
        </div>

        {session.paused ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff8e6" }}>
            已暫停；請按「繼續」後再作答。
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* 提示區：左側顯示提示 + 次數，右側塗鴉牆 */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button style={{ ...btn, opacity: !session.paused && canHint ? 1 : 0.5 }} onClick={onHint} disabled={session.paused || !canHint}>
              顯示提示
            </button>
            <span style={pill}>
              {session.hintUsed}/{session.hintLimit}
            </span>
          </div>

          <button style={btn} onClick={() => setWhiteboardOpen(true)} disabled={session.paused}>
            📝 塗鴉牆
          </button>
        </div>

        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: "1px dashed #e0e0e0", opacity: hintText ? 1 : 0.7 }}>
          {hintText ? hintText : "尚未使用提示"}
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* 作答區（demo） */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
          <div style={{ fontWeight: 900, fontSize: 20 }}>作答區（demo）</div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={pill}>對：{session.correctCount}</span>
            <span style={pill}>錯：{session.wrongCount}</span>
          </div>
        </div>

        <div style={{ opacity: 0.7, lineHeight: 1.8 }}>
          目前為示範模式：先選「答對/答錯」，再按「確定」，系統判定後延遲 2 秒自動下一題。
        </div>

        <div style={{ height: 10 }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={{ ...btn, border: picked === "correct" ? "1px solid #111" : btn.border, opacity: locked ? 0.5 : 1 }}
            onClick={pickCorrect}
            disabled={locked}
          >
            選擇：答對
          </button>

          <button
            style={{ ...btn, border: picked === "wrong" ? "1px solid #111" : btn.border, opacity: locked ? 0.5 : 1 }}
            onClick={pickWrong}
            disabled={locked}
          >
            選擇：答錯
          </button>

          <button
            style={{ ...btnPrimary, opacity: locked || !picked ? 0.5 : 1, cursor: locked || !picked ? "not-allowed" : "pointer" }}
            onClick={confirmPick}
            disabled={locked || !picked}
          >
            確定
          </button>
        </div>

        {msg ? <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div> : null}
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}