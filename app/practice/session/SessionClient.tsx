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
  top: 74,
  zIndex: 999,
  ...btnGhost,
};

/* ================= 常數 ================= */
const TOTAL_QUESTIONS = 20;
const HINT_LIMIT = 5;
const AUTO_NEXT_DELAY_MS = 2000;

type RevealState = {
  selected: string | null;
  correct: string | null;
  isCorrect: boolean | null;
};

function getStageLabel(session: PracticeSession) {
  return ((session as any).stage ?? "-") as string;
}

/** v3-1 Step2：提示分層（hints[] > hint） */
function computeHint(q: Question | null, used: number): string {
  if (!q) return "尚未使用提示。";
  if (used <= 0) return "尚未使用提示。";

  const anyQ: any = q as any;
  const hints: string[] | undefined = anyQ.hints;

  if (Array.isArray(hints) && hints.length > 0) {
    const idx = Math.min(used - 1, hints.length - 1);
    return hints[idx] ?? hints[hints.length - 1];
  }

  if (q.hint) return q.hint;

  return "（此題暫無提示）";
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string>("尚未使用提示。");
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v3：作答流程
  const [pickedChoice, setPickedChoice] = useState<string | null>(null); // 使用者選到的 choice
  const [judging, setJudging] = useState(false); // 判定中（2 秒鎖定）
  const [reveal, setReveal] = useState<RevealState>({ selected: null, correct: null, isCorrect: null });

  const nextTimerRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  /* ================= 工具 ================= */
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

    // ✅ 強制提示上限 = 5（基底不動，但這個屬於 v3-1 UI 規格）
    let patched = s;
    if ((patched as any).hintLimit !== HINT_LIMIT) {
      patched = { ...patched, hintLimit: HINT_LIMIT } as any;
      寫入進度(patched);
    }

    setSession(patched);
    setMsg(null);

    // 重置題目狀態
    setPickedChoice(null);
    setJudging(false);
    setReveal({ selected: null, correct: null, isCorrect: null });
    clearNextTimer();

    // 進來先顯示「尚未使用提示」
    setHintText("尚未使用提示。");
  }, [router, sp]);

  /* ================= 計算狀態 ================= */
  const stage = useMemo(() => (session ? getStageLabel(session) : "-"), [session]);

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  }, [session]);

  const isFinished = useMemo(() => answeredCount >= TOTAL_QUESTIONS, [answeredCount]);

  const currentIndex = useMemo(() => {
    if (!session) return 0;
    return Math.min(session.currentIndex, TOTAL_QUESTIONS - 1);
  }, [session]);

  const question = useMemo(() => {
    if (!session) return null;
    return getQuestionByIndex(session.subject, stage, currentIndex);
  }, [session, stage, currentIndex]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return (session.hintUsed ?? 0) < HINT_LIMIT && !session.paused && !isFinished;
  }, [session, isFinished]);

  const locked = useMemo(() => {
    // 暫停 / 判定中 / 已完成 -> 鎖住所有作答
    return !session || session.paused || judging || isFinished;
  }, [session, judging, isFinished]);

  /* ================= 計時（僅在未暫停 & 未完成時） ================= */
  useEffect(() => {
    if (!session) return;

    // 先清掉舊的 interval
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // ✅ 完成就不要再計時（你說完成頁秒數不該繼續跑）
    if (isFinished) return;

    // 暫停也不要計時
    if (session.paused) return;

    timerRef.current = window.setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;

        // 若在 interval 中途剛好已完成，就不要再加
        const done = (prev.correctCount ?? 0) + (prev.wrongCount ?? 0) >= TOTAL_QUESTIONS;
        if (done) return prev;

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

  // 離開頁面時清除 timer / timeout
  useEffect(() => {
    return () => {
      clearNextTimer();
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, []);

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
    if (!canHint) return;

    const used = (session.hintUsed ?? 0) + 1;
    const next = { ...session, hintUsed: used, hintLimit: HINT_LIMIT } as any;

    寫入進度(next);
    setSession(next);

    setHintText(computeHint(question, used));
  }

  /* ================= v3：選項 / 確定 / 顯示判定 / 2 秒後下一題 ================= */
  function pickChoice(choice: string) {
    if (locked) return;
    setPickedChoice(choice);
    setMsg(null);

    // 還沒判定，不顯示紅綠
    setReveal({ selected: null, correct: null, isCorrect: null });
  }

  function confirmPick() {
    if (!session) return;
    if (locked) return;

    if (!question) {
      setMsg("題目讀取失敗，請回上一頁重進。");
      return;
    }

    if (!pickedChoice) {
      setMsg("請先選擇一個選項，再按「確定」。");
      return;
    }

    const isCorrect = pickedChoice === question.answer;

    const next = isCorrect
      ? { ...session, correctCount: (session.correctCount ?? 0) + 1 }
      : { ...session, wrongCount: (session.wrongCount ?? 0) + 1 };

    寫入進度(next);
    setSession(next);

    // ✅ v3-1 Step2：顯示紅/綠結果（2 秒）
    setReveal({ selected: pickedChoice, correct: question.answer, isCorrect });

    setJudging(true);
    setMsg(isCorrect ? "✅ 判定：答對！2 秒後進入下一題…" : "❌ 判定：答錯！2 秒後進入下一題…");

    clearNextTimer();
    nextTimerRef.current = window.setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;

        const newAnswered = (prev.correctCount ?? 0) + (prev.wrongCount ?? 0);
        if (newAnswered >= TOTAL_QUESTIONS) {
          return prev; // ✅ 已完成就停在完成頁
        }

        const moved = { ...prev, currentIndex: prev.currentIndex + 1 };
        寫入進度(moved);
        return moved;
      });

      // 重置本題狀態（進下一題）
      setPickedChoice(null);
      setJudging(false);
      setReveal({ selected: null, correct: null, isCorrect: null });

      // 下一題提示面板先回到「尚未使用提示」
      setHintText("尚未使用提示。");
      setMsg(null);
    }, AUTO_NEXT_DELAY_MS);
  }

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
            <span style={pill}>
              題數：{TOTAL_QUESTIONS}/{TOTAL_QUESTIONS}
            </span>
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

  /* ================= 題目按鈕樣式（紅/綠回饋） ================= */
  function choiceStyle(choice: string): React.CSSProperties {
    const base: React.CSSProperties = {
      ...btn,
      width: "100%",
      textAlign: "left",
      borderRadius: 14,
      padding: "12px 14px",
    };

    // 未判定：只顯示選取框
    if (!judging && reveal.isCorrect === null) {
      if (pickedChoice === choice) {
        return { ...base, border: "1px solid #111" };
      }
      return base;
    }

    // 判定中：顯示紅/綠
    const isPicked = reveal.selected === choice;
    const isAnswer = reveal.correct === choice;

    // 正確答案（綠）
    if (isAnswer) {
      return { ...base, border: "1px solid #2f7d32", background: "#ecf7ed" };
    }

    // 選錯的那個（紅）
    if (isPicked && !isAnswer) {
      return { ...base, border: "1px solid #c62828", background: "#fdecec" };
    }

    // 其他保持灰
    return { ...base, opacity: 0.9 };
  }

  /* ================= UI ================= */
  return (
    <main style={wrap}>
      {/* ✅ 回上一頁：固定右上角 */}
      <button style={fixedTopRightBtn} onClick={backToPractice}>
        ← 回上一頁
      </button>

      {/* ===== 狀態卡：同一排右側放計時/暫停 ===== */}
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

      {/* ===== 題目區（v3-1 Step2：題幹右側放小段說明）===== */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 900, fontSize: 24 }}>題目</div>

          {/* ✅ 題目說明（搬到右側，節省下方空間） */}
          <div style={{ ...pill, maxWidth: 220, whiteSpace: "normal", lineHeight: 1.4, opacity: 0.85 }}>
            {question?.prompt?.split("\n")[0] ?? "（題目載入中）"}
          </div>
        </div>

        <div style={{ height: 10 }} />

        {/* 題幹主內容 */}
        <div style={{ fontSize: 18, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
          {question ? question.prompt : "題目讀取中…"}
        </div>

        <div style={{ height: 12 }} />

        {/* 選項 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(question?.choices ?? []).map((c) => (
            <button key={c} style={choiceStyle(c)} onClick={() => pickChoice(c)} disabled={locked}>
              {c}
            </button>
          ))}
        </div>

        <div style={{ height: 12 }} />

        {/* 下排：確定 + 狀態 + 對錯 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button
              style={{ ...btnPrimary, opacity: locked || !pickedChoice ? 0.5 : 1 }}
              onClick={confirmPick}
              disabled={locked || !pickedChoice}
            >
              確定
            </button>

            <span style={pill}>{pickedChoice ? "已選擇" : "尚未選擇"}</span>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <span style={pill}>對：{session.correctCount ?? 0}</span>
            <span style={pill}>錯：{session.wrongCount ?? 0}</span>
          </div>
        </div>

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區（顯示提示 + 0/5 + 塗鴉牆）===== */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              style={{ ...btn, opacity: canHint ? 1 : 0.5 }}
              onClick={onHint}
              disabled={!canHint}
            >
              顯示提示
            </button>

            <span style={pill}>
              {session.hintUsed ?? 0}/{HINT_LIMIT}
            </span>
          </div>

          <button style={btn} onClick={() => setWhiteboardOpen(true)} disabled={session.paused}>
            📝 塗鴉牆
          </button>
        </div>

        <div
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            border: "1px dashed #e0e0e0",
            opacity: hintText ? 1 : 0.7,
            whiteSpace: "pre-wrap",
            lineHeight: 1.7,
          }}
        >
          {hintText}
        </div>
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}