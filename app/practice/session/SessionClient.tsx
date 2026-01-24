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

const fixedTopRightBtn: React.CSSProperties = {
  position: "fixed",
  right: 14,
  top: 74, // 若 navbar 高度不同可微調
  zIndex: 999,
  ...btnGhost,
};

/* ================= 常數 ================= */
const TOTAL_QUESTIONS = 20;
const HINT_LIMIT_V3 = 5;
const AUTO_NEXT_DELAY_MS = 2000;

/* ================= 題庫（v3-1 demo，之後可換成正式題庫）================= */
type MCQ = {
  id: string;
  stage: string;
  title: string; // 題幹（含「選出...」）
  options: string[]; // 4個選項
  answerIndex: number; // 正確選項 index
  hint?: string;
};

function makeDemoQuestions(stage: string): MCQ[] {
  // 這裡用固定題庫 + 按 stage 顯示（題意一樣，之後再按 stage 調難度）
  const base: Array<Omit<MCQ, "stage">> = [
    {
      id: "q1",
      title: `選出「藍色」的英文：`,
      options: ["blue", "apple", "run", "happy"],
      answerIndex: 0,
      hint: "顏色題：想想天空/海的顏色。",
    },
    {
      id: "q2",
      title: `選出「蘋果」的英文：`,
      options: ["cat", "apple", "swim", "green"],
      answerIndex: 1,
      hint: "水果題：iPhone 的那個品牌也叫這個。",
    },
    {
      id: "q3",
      title: `選出「跑步」的英文：`,
      options: ["run", "book", "yellow", "sleep"],
      answerIndex: 0,
      hint: "動作題：田徑場上做的事。",
    },
    {
      id: "q4",
      title: `選出「開心」的英文：`,
      options: ["sad", "happy", "chair", "black"],
      answerIndex: 1,
      hint: "情緒題：跟 sad 相反。",
    },
    {
      id: "q5",
      title: `選出「綠色」的英文：`,
      options: ["green", "bread", "write", "angry"],
      answerIndex: 0,
      hint: "顏色題：草地的顏色。",
    },
    {
      id: "q6",
      title: `選出「貓」的英文：`,
      options: ["dog", "cat", "fish", "bird"],
      answerIndex: 1,
      hint: "動物題：會喵喵叫。",
    },
    {
      id: "q7",
      title: `選出「紅色」的英文：`,
      options: ["red", "read", "rice", "ride"],
      answerIndex: 0,
      hint: "顏色題：注意 red / read 發音不同。",
    },
    {
      id: "q8",
      title: `選出「書」的英文：`,
      options: ["book", "back", "bake", "bank"],
      answerIndex: 0,
      hint: "名詞題：讀的東西。",
    },
    {
      id: "q9",
      title: `選出「睡覺」的英文：`,
      options: ["sleep", "sweep", "slip", "slap"],
      answerIndex: 0,
      hint: "動作題：每天晚上都要做。",
    },
    {
      id: "q10",
      title: `選出「黃色」的英文：`,
      options: ["yell", "yellow", "yoga", "year"],
      answerIndex: 1,
      hint: "顏色題：香蕉常常是這個顏色。",
    },
  ];

  // 生成 20 題：重複 base 但加上序號避免 id 重複
  const out: MCQ[] = [];
  for (let i = 0; i < TOTAL_QUESTIONS; i++) {
    const b = base[i % base.length];
    out.push({
      stage,
      id: `${b.id}_${i + 1}`,
      title: b.title,
      options: b.options,
      answerIndex: b.answerIndex,
      hint: b.hint,
    });
  }
  return out;
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v3-1：作答流程
  const [pickedIndex, setPickedIndex] = useState<number | null>(null); // 使用者選了哪個選項
  const [judging, setJudging] = useState(false); // 按下確定後 2 秒延遲期間鎖定
  const nextTimerRef = useRef<number | null>(null);

  // 計時
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

    // ✅ v3：提示次數統一 5 次（自動修正）
    const fixedHintLimit = HINT_LIMIT_V3;
    const fixedHintUsed = Math.min(s.hintUsed ?? 0, fixedHintLimit);

    const fixedSession: PracticeSession = {
      ...s,
      hintLimit: fixedHintLimit,
      hintUsed: fixedHintUsed,
      correctCount: s.correctCount ?? 0,
      wrongCount: s.wrongCount ?? 0,
      elapsedSec: s.elapsedSec ?? 0,
      currentIndex: s.currentIndex ?? 0,
      paused: s.paused ?? false,
    };

    寫入進度(fixedSession);

    setSession(fixedSession);
    setMsg(null);
    setHintText(null);

    // v3：重置作答流程
    setPickedIndex(null);
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
  const stage = ((session as any)?.stage ?? "-") as string;

  const questions = useMemo(() => makeDemoQuestions(stage), [stage]);

  const currentQ = useMemo(() => {
    if (!session) return null;
    const idx = Math.max(0, Math.min(session.currentIndex ?? 0, TOTAL_QUESTIONS - 1));
    return questions[idx] ?? null;
  }, [questions, session]);

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  }, [session]);

  const isFinished = useMemo(() => {
    return answeredCount >= TOTAL_QUESTIONS;
  }, [answeredCount]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return (session.hintUsed ?? 0) < (session.hintLimit ?? HINT_LIMIT_V3);
  }, [session]);

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

    const next = { ...session, hintUsed: (session.hintUsed ?? 0) + 1 };
    寫入進度(next);
    setSession(next);

    // v3：如果題目有 hint 就用題目 hint
    setHintText(currentQ?.hint ?? "提示：先找關鍵字，再拆步驟，最後再判斷/計算。");
  }

  /* ================= v3-1：選項 / 確定 / 2 秒後自動下一題 ================= */
  function pickOption(i: number) {
    if (locked) return;
    setPickedIndex(i);
    setMsg(null);
  }

  function confirmPick() {
    if (!session) return;
    if (locked) return;
    if (pickedIndex === null) {
      setMsg("請先選擇一個選項，再按「確定」。");
      return;
    }
    if (!currentQ) {
      setMsg("題目載入中，請稍後再試一次。");
      return;
    }

    const isCorrect = pickedIndex === currentQ.answerIndex;

    const next: PracticeSession = {
      ...session,
      correctCount: (session.correctCount ?? 0) + (isCorrect ? 1 : 0),
      wrongCount: (session.wrongCount ?? 0) + (!isCorrect ? 1 : 0),
    };

    寫入進度(next);
    setSession(next);

    setJudging(true);
    setMsg(isCorrect ? "✅ 判定：答對！2 秒後進入下一題…" : "❌ 判定：答錯！2 秒後進入下一題…");

    clearNextTimer();
    nextTimerRef.current = window.setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;

        const newAnswered = (prev.correctCount ?? 0) + (prev.wrongCount ?? 0);
        if (newAnswered >= TOTAL_QUESTIONS) {
          return prev;
        }

        const moved: PracticeSession = { ...prev, currentIndex: (prev.currentIndex ?? 0) + 1 };
        寫入進度(moved);
        return moved;
      });

      setPickedIndex(null);
      setJudging(false);
      setHintText(null);
      setMsg(null);
    }, AUTO_NEXT_DELAY_MS);
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
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>題數：{TOTAL_QUESTIONS}/{TOTAL_QUESTIONS}</span>
            <span style={pill}>用時：{格式化時間(session.elapsedSec ?? 0)}</span>
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
      {/* ✅ 回上一頁固定在頂部右側 */}
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
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>
              第 {Math.min((session.currentIndex ?? 0) + 1, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS} 題
            </span>
          </div>

          {/* 右側：計時 + 暫停 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>⏱ {格式化時間(session.elapsedSec ?? 0)}</span>

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

      {/* ===== 題目區（v3-1）===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 8 }}>題目</div>

        <div style={{ fontSize: 18, lineHeight: 1.9 }}>
          第 {Math.min((session.currentIndex ?? 0) + 1, TOTAL_QUESTIONS)} 題（{(session as any).stage ?? "-"}）：{" "}
          {currentQ ? currentQ.title : "讀取中…"}
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(currentQ?.options ?? ["載入中…", "載入中…", "載入中…", "載入中…"]).map((opt, i) => {
            const selected = pickedIndex === i;
            return (
              <button
                key={i}
                style={{
                  ...btn,
                  textAlign: "left",
                  width: "100%",
                  border: selected ? "1px solid #111" : btn.border,
                  opacity: locked ? 0.6 : 1,
                }}
                onClick={() => pickOption(i)}
                disabled={locked}
              >
                {String.fromCharCode(65 + i)}. {opt}
              </button>
            );
          })}
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              style={{
                ...btnPrimary,
                opacity: locked || pickedIndex === null ? 0.5 : 1,
                cursor: locked || pickedIndex === null ? "not-allowed" : "pointer",
              }}
              onClick={confirmPick}
              disabled={locked || pickedIndex === null}
            >
              確定
            </button>

            {judging ? (
              <span style={pill}>判定中…</span>
            ) : (
              <span style={pill}>尚未判定</span>
            )}
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

      {/* ===== 提示區（拿掉「提示」標題，改成左上放「顯示提示」）===== */}
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
          {/* 左側：顯示提示 + 次數 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              style={{ ...btn, opacity: !session.paused && canHint ? 1 : 0.5 }}
              onClick={onHint}
              disabled={session.paused || !canHint}
            >
              顯示提示
            </button>

            <span style={pill}>
              {session.hintUsed ?? 0}/{session.hintLimit ?? HINT_LIMIT_V3}
            </span>
          </div>

          {/* 右側：塗鴉牆 */}
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
          {hintText ? hintText : "尚未使用提示。"}
        </div>
      </div>

      {/* ✅ Whiteboard 本體 */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}