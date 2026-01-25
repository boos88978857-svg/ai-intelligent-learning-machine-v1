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

import { getQuestionByIndex, type Question } from "./question-bank";

/* ================= 基本樣式（沿用 v2-9 冻结基底） ================= */
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

const fixedTopRightBtn: React.CSSProperties = {
  position: "fixed",
  right: 14,
  top: 74, // 贴近你的顶栏（如 navbar 高度不同可微调）
  zIndex: 999,
  ...btnGhost,
};

/* ================= 常數（v3-1 仍沿用 20 題一回合） ================= */
const TOTAL_QUESTIONS = 20;

/* ✅ v3-1 UI 需求：提示固定 5 次 */
const HINT_LIMIT = 5;

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v3-1：選擇題作答狀態
  const [selected, setSelected] = useState<string | null>(null);
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

    // ✅ v3-1：提示固定 5 次（不改你的基底结构，只做最小兼容）
    const patched = {
      ...s,
      hintLimit: HINT_LIMIT,
      hintUsed: typeof s.hintUsed === "number" ? s.hintUsed : 0,
    };

    寫入進度(patched);
    setSession(patched);

    // reset UI
    setMsg(null);
    setHintText(null);
    setSelected(null);
    setJudging(false);
    clearNextTimer();
  }, [router, sp]);

  /* ================= 計時（僅在未暫停 & 未完成時） ================= */
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    const answeredCount = (session.correctCount ?? 0) + (session.wrongCount ?? 0);
    const finished = answeredCount >= TOTAL_QUESTIONS;

    if (session.paused || finished) return;

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
  }, [session?.id, session?.paused, session?.correctCount, session?.wrongCount]);

  /* ================= 計算狀態 ================= */
  const stage = useMemo(() => {
    if (!session) return "-";
    return (session as any).stage ?? "-";
  }, [session]);

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  }, [session]);

  const isFinished = useMemo(() => answeredCount >= TOTAL_QUESTIONS, [answeredCount]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return (session.hintUsed ?? 0) < HINT_LIMIT;
  }, [session]);

  const locked = useMemo(() => {
    return !session || session.paused || judging || isFinished;
  }, [session, judging, isFinished]);

  const question: Question | null = useMemo(() => {
    if (!session) return null;
    return getQuestionByIndex(session.subject, stage, session.currentIndex);
  }, [session, stage]);

  /* ================= v3-1 UI-1：把 prompt 第一行搬到「題目」右側 ================= */
  const promptTitle = useMemo(() => {
    const p = question?.prompt ?? "";
    const first = p.split("\n")[0] ?? "";
    return first.trim();
  }, [question]);

  const promptBody = useMemo(() => {
    const p = question?.prompt ?? "";
    const lines = p.split("\n");
    const rest = lines.slice(1).join("\n").trim();
    return rest;
  }, [question]);

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

    const next = { ...session, hintUsed: (session.hintUsed ?? 0) + 1, hintLimit: HINT_LIMIT };
    寫入進度(next);
    setSession(next);

    // ✅ 若题库有 hint，就用；没有就用默认
    setHintText(question?.hint ?? "提示：先找關鍵字，再拆步驟，最後再判斷/計算。");
  }

  /* ================= v3-1：選擇 / 確定 / 2 秒後自動下一題 ================= */
  function choose(choice: string) {
    if (locked) return;
    setSelected(choice);
    setMsg(null);
  }

  function confirm() {
    if (!session || locked) return;
    if (!question) {
      setMsg("題目讀取失敗，請回學習區重新進入。");
      return;
    }
    if (!selected) {
      setMsg("請先選擇一個選項，再按「確定」。");
      return;
    }

    const isCorrect = selected === question.answer;

    const next = isCorrect
      ? { ...session, correctCount: (session.correctCount ?? 0) + 1 }
      : { ...session, wrongCount: (session.wrongCount ?? 0) + 1 };

    寫入進度(next);
    setSession(next);

    setJudging(true);
    setMsg(isCorrect ? "✅ 判定：答對！2 秒後進入下一題…" : "❌ 判定：答錯！2 秒後進入下一題…");

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

      // reset for next
      setSelected(null);
      setJudging(false);
      setHintText(null);
      setMsg(null);
    }, 2000);
  }

  // 離開頁面時清除 timer
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
            <span style={pill}>{session.subject}</span>
            <span style={pill}>{stage}</span>
            <span style={pill}>題數：{TOTAL_QUESTIONS}/{TOTAL_QUESTIONS}</span>
            <span style={pill}>用時：{格式化時間(session.elapsedSec)}</span>
          </div>

          <div style={{ height: 8 }} />

          <div style={row}>
            <span style={pill}>答對：{session.correctCount ?? 0}</span>
            <span style={pill}>答錯：{session.wrongCount ?? 0}</span>
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
      {/* ✅ 回上一頁固定右上 */}
      <button style={fixedTopRightBtn} onClick={backToPractice}>
        ← 回上一頁
      </button>

      {/* ===== 狀態卡（右側放：計時 + 暫停）===== */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            {/* ✅ 你已決定拿掉「科目：」，所以这里直接显示 subject */}
            <span style={pill}>{session.subject}</span>
            <span style={pill}>{stage}</span>
            <span style={pill}>
              第 {Math.min(answeredCount + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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

      {/* ===== 提示區（左：顯示提示 + 次數 0/5；右：塗鴉牆）===== */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              style={{ ...btn, opacity: !session.paused && canHint ? 1 : 0.5 }}
              onClick={onHint}
              disabled={session.paused || !canHint}
            >
              顯示提示
            </button>

            <span style={pill}>
              {(session.hintUsed ?? 0)}/{HINT_LIMIT}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button style={btn} onClick={() => setWhiteboardOpen(true)} disabled={session.paused}>
              📝 塗鴉牆
            </button>
          </div>
        </div>

        <div
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            border: "1px dashed #e0e0e0",
            opacity: hintText ? 1 : 0.7,
          }}
        >
          {hintText ? hintText : "尚未使用提示"}
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 題目區（v3-1：MCQ）===== */}
      <div style={card}>
        {/* ✅ UI-1：題目第一行说明搬到「題目」右侧 */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, fontSize: 24 }}>題目</div>
          <div style={{ opacity: 0.75, fontSize: 14 }}>{promptTitle}</div>
        </div>

        <div style={{ height: 8 }} />

        {promptBody ? (
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: 18 }}>
            {promptBody}
          </div>
        ) : null}

        <div style={{ height: 12 }} />

        {/* 選項 */}
        <div style={{ display: "grid", gap: 10 }}>
          {(question?.choices ?? []).map((c) => {
            const isPick = selected === c;
            return (
              <button
                key={c}
                onClick={() => choose(c)}
                disabled={locked}
                style={{
                  ...btn,
                  textAlign: "left",
                  padding: "14px 14px",
                  borderRadius: 14,
                  opacity: locked ? 0.5 : 1,
                  border: isPick ? "1px solid #111" : btn.border,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div style={{ height: 12 }} />

        {/* 下方操作列 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              style={{
                ...btnPrimary,
                opacity: locked || !selected ? 0.5 : 1,
                cursor: locked || !selected ? "not-allowed" : "pointer",
              }}
              onClick={confirm}
              disabled={locked || !selected}
            >
              確定
            </button>

            <span style={pill}>{selected ? "已選擇" : "尚未選擇"}</span>
          </div>

          {/* ✅ v3-1：對/錯要累計（顯示總計） */}
          <div style={{ display: "flex", gap: 8 }}>
            <span style={pill}>對：{session.correctCount ?? 0}</span>
            <span style={pill}>錯：{session.wrongCount ?? 0}</span>
          </div>
        </div>

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div>
        ) : null}
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}