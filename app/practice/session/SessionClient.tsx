// app/practice/session/SessionClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import Whiteboard from "../../components/Whiteboard";

// ✅ v3-1：題庫（你剛剛新增的檔案）
import { getQuestionByIndex, type Question } from "./question-bank";

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

const fixedTopRightBtn: React.CSSProperties = {
  position: "fixed",
  right: 14,
  top: 74, // 若你的 navbar 高度不同，可微調
  zIndex: 999,
  ...btnGhost,
};

/* ================= 常數（20 題一回合） ================= */
const TOTAL_QUESTIONS = 20;

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v2-9：作答流程（先選 → 確定 → 2 秒後自動下一題）
  const [picked, setPicked] = useState<string | null>(null); // v3-1：改為「選到的選項文字」
  const [judging, setJudging] = useState(false);
  const nextTimerRef = useRef<number | null>(null);

  // 計時
  const timerRef = useRef<number | null>(null);

  /* ================= 工具 ================= */
  function backToPractice() {
    // ✅ 不要帶 query，避免 /practice 自動建進度造成閃跳
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

    // 重置本題狀態
    setPicked(null);
    setJudging(false);
    clearNextTimer();
  }, [router, sp]);

  /* ================= 計算狀態 ================= */
  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  }, [session]);

  const isFinished = useMemo(() => answeredCount >= TOTAL_QUESTIONS, [answeredCount]);

  const stage = useMemo(() => {
    if (!session) return "";
    return ((session as any).stage ?? "").toString();
  }, [session]);

  // ✅ v3-1：根據 subject + stage + currentIndex 拿題目
  const question: Question | null = useMemo(() => {
    if (!session) return null;
    const q = getQuestionByIndex(session.subject, stage, session.currentIndex);
    return q ?? null;
  }, [session, stage]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return session.hintUsed < session.hintLimit;
  }, [session]);

  const locked = useMemo(() => {
    // 暫停 / 判定中 / 完成，都要鎖住
    return !session || session.paused || judging || isFinished;
  }, [session, judging, isFinished]);

  /* ================= 計時（僅在未暫停 & 未完成時） ================= */
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (session.paused) return;
    if (isFinished) return; // ✅ 完成就停表

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
  }, [session?.id, session?.paused, isFinished]);

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

    // ✅ v3-1：優先顯示題目的 hint（沒有就用預設）
    setHintText(question?.hint ?? "提示：先找關鍵字，再拆步驟，最後再判斷/計算。");
  }

  /* ================= v3-1：選項點擊 ================= */
  function pickChoice(choice: string) {
    if (locked) return;
    setPicked(choice);
    setMsg(null);
  }

  /* ================= v3-1：確定 → 判分 → 2 秒後自動下一題 ================= */
  function confirmPick() {
    if (!session) return;
    if (locked) return;

    if (!picked) {
      setMsg("請先選擇一個答案，再按「確定」。");
      return;
    }

    // ✅ v3-1 demo 判分：用題目 answer 比對（之後你要換成題庫/AI 判分也從這裡換）
    const isCorrect = question?.answer ? picked === question.answer : false;

    const next = isCorrect
      ? { ...session, correctCount: (session.correctCount ?? 0) + 1 }
      : { ...session, wrongCount: (session.wrongCount ?? 0) + 1 };

    寫入進度(next);
    setSession(next);

    setJudging(true);
    setMsg(isCorrect ? "✅ 判定：答對！2 秒後進入下一題…" : "❌ 判定：很可惜答錯了！2 秒後進入下一題…");

    clearNextTimer();
    nextTimerRef.current = window.setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;

        const newAnswered = (prev.correctCount ?? 0) + (prev.wrongCount ?? 0);
        if (newAnswered >= TOTAL_QUESTIONS) {
          return prev;
        }

        const moved = { ...prev, currentIndex: prev.currentIndex + 1 };
        寫入進度(moved);
        return moved;
      });

      // 重置本題狀態
      setPicked(null);
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
            <span style={pill}>{(session as any).stage ?? "-"}</span>
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
      {/* ✅ 回上一頁固定在頂部右側（靠近關於右側） */}
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
            <span style={pill}>{session.subject}</span>
            <span style={pill}>{(session as any).stage ?? "-"}</span>
            <span style={pill}>第 {Math.min(session.currentIndex + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}</span>
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

      {/* ===== 提示區（左上：顯示提示 + 次數；右上：塗鴉牆）===== */}
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
              {session.hintUsed}/{session.hintLimit}
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

      {/* ===== 題目區（v3-1 新增）===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>題目</div>

        {question ? (
          <>
            <div style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{question.prompt}</div>

            {question.type === "mcq" && Array.isArray(question.choices) ? (
              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                {question.choices.map((c) => {
                  const selected = picked === c;
                  return (
                    <button
                      key={c}
                      onClick={() => pickChoice(c)}
                      disabled={locked}
                      style={{
                        ...btn,
                        textAlign: "left",
                        border: selected ? "1px solid #111" : btn.border,
                        opacity: locked ? 0.6 : 1,
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ marginTop: 10, opacity: 0.75 }}>
                （此題型尚未接上，v3-2 再補）
              </div>
            )}
          </>
        ) : (
          <div style={{ opacity: 0.75, lineHeight: 1.8 }}>
            目前題庫沒有這一題（subject/stage 沒對到或題數不足）。<br />
            你可以先在 <code>question-bank.ts</code> 加題目。
          </div>
        )}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 作答確認區（v2-9 保持：確定 → 2 秒後自動下一題）===== */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 20 }}>作答</div>

          <div style={{ display: "flex", gap: 8 }}>
            <span style={pill}>對：{session.correctCount}</span>
            <span style={pill}>錯：{session.wrongCount}</span>
          </div>
        </div>

        <div style={{ opacity: 0.7, lineHeight: 1.8 }}>
          選好答案後按「確定」，系統判定後延遲 2 秒自動下一題。
        </div>

        <div style={{ height: 10 }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={{
              ...btnPrimary,
              opacity: locked || !picked ? 0.5 : 1,
              cursor: locked || !picked ? "not-allowed" : "pointer",
            }}
            onClick={confirmPick}
            disabled={locked || !picked}
          >
            確定
          </button>
        </div>

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>
            {msg}
          </div>
        ) : null}
      </div>

      {/* ✅ Whiteboard 本體 */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}