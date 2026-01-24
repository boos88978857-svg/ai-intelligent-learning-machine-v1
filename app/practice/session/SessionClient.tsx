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
  type Subject,
} from "../../../lib/session";

/* ================= 基本樣式（v2-9 冻结）================= */
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
  top: 74, // 若你 navbar 高度不同，可微调
  zIndex: 999,
  ...btnGhost,
};

/* ================= 常數（v2-9：20 題一回合） ================= */
const TOTAL_QUESTIONS = 20;

/* ================= v3-1 題目資料（demo 題庫） ================= */
type ChoiceQuestion = {
  id: string;
  stage: string; // A1/A2/B1/B2/C1/C2/APPLIED...
  title: string; // 題目文字
  choices: { key: string; text: string }[]; // A/B/C/D
  answerKey: string; // 正解 key
};

// 小工具：穩定產生 20 題（依 stage 不同）
function buildEnglishQuestions(stage: string): ChoiceQuestion[] {
  // 這裡先做 demo：每個 stage 都給 20 題（內容簡單，可後續換成真題庫）
  const bank: ChoiceQuestion[] = [
    {
      id: "q1",
      stage,
      title: `第 1 題（${stage}）：選出「藍色」的英文：`,
      choices: [
        { key: "A", text: "blue" },
        { key: "B", text: "apple" },
        { key: "C", text: "run" },
        { key: "D", text: "happy" },
      ],
      answerKey: "A",
    },
    {
      id: "q2",
      stage,
      title: `第 2 題（${stage}）：選出「蘋果」的英文：`,
      choices: [
        { key: "A", text: "blue" },
        { key: "B", text: "apple" },
        { key: "C", text: "book" },
        { key: "D", text: "car" },
      ],
      answerKey: "B",
    },
    {
      id: "q3",
      stage,
      title: `第 3 題（${stage}）：選出「跑步」的英文：`,
      choices: [
        { key: "A", text: "run" },
        { key: "B", text: "red" },
        { key: "C", text: "slow" },
        { key: "D", text: "shoe" },
      ],
      answerKey: "A",
    },
    {
      id: "q4",
      stage,
      title: `第 4 題（${stage}）：選出「開心」的英文：`,
      choices: [
        { key: "A", text: "happy" },
        { key: "B", text: "heavy" },
        { key: "C", text: "quiet" },
        { key: "D", text: "late" },
      ],
      answerKey: "A",
    },
    {
      id: "q5",
      stage,
      title: `第 5 題（${stage}）：選出「書」的英文：`,
      choices: [
        { key: "A", text: "shoe" },
        { key: "B", text: "book" },
        { key: "C", text: "cook" },
        { key: "D", text: "look" },
      ],
      answerKey: "B",
    },
  ];

  // 補到 20 題：用規律題（可後續替換）
  const padded: ChoiceQuestion[] = [...bank];
  for (let i = padded.length + 1; i <= TOTAL_QUESTIONS; i++) {
    const n = i;
    // 讓每題答案不一樣，避免都 A
    const keys = ["A", "B", "C", "D"] as const;
    const ans = keys[(n - 1) % 4];
    padded.push({
      id: `q${n}`,
      stage,
      title: `第 ${n} 題（${stage}）：選出正確選項（demo 題）：`,
      choices: [
        { key: "A", text: `Option A (${stage})` },
        { key: "B", text: `Option B (${stage})` },
        { key: "C", text: `Option C (${stage})` },
        { key: "D", text: `Option D (${stage})` },
      ],
      answerKey: ans,
    });
  }
  return padded.slice(0, TOTAL_QUESTIONS);
}

function buildQuestions(subject: Subject, stage: string): ChoiceQuestion[] {
  if (subject === "英文") return buildEnglishQuestions(stage);
  // 其他科目先用通用 demo 題
  const arr: ChoiceQuestion[] = [];
  for (let i = 1; i <= TOTAL_QUESTIONS; i++) {
    arr.push({
      id: `g${i}`,
      stage,
      title: `第 ${i} 題（${stage}）：這是示範題（${subject}）`,
      choices: [
        { key: "A", text: "選項 A" },
        { key: "B", text: "選項 B" },
        { key: "C", text: "選項 C" },
        { key: "D", text: "選項 D" },
      ],
      answerKey: "A",
    });
  }
  return arr;
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI（v2-9 冻结）
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v2-9：作答流程（冻结：2 秒后自动下一题）
  const [judging, setJudging] = useState(false);
  const nextTimerRef = useRef<number | null>(null);

  // v3-1：题目选项（用户选择 A/B/C/D）
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  // 計時
  const timerRef = useRef<number | null>(null);

  /* ================= 工具 ================= */
  function backToPractice() {
    // ✅ 不带 query，避免 PracticeClient 自動建進度造成閃跳
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

    // ✅ v3-1：把提示次数固定为 5（你要求后续统一 5 次；这里直接落实）
    // 若你 lib/session 里本来就会设定，也不会冲突；没有就补上。
    const patched: PracticeSession = {
      ...s,
      hintLimit: 5,
      // 确保这些字段存在，避免 NaN
      correctCount: (s as any).correctCount ?? 0,
      wrongCount: (s as any).wrongCount ?? 0,
      hintUsed: (s as any).hintUsed ?? 0,
      elapsedSec: (s as any).elapsedSec ?? 0,
      currentIndex: (s as any).currentIndex ?? 0,
      paused: (s as any).paused ?? false,
    };

    寫入進度(patched);
    setSession(patched);

    setMsg(null);
    setHintText(null);

    // 重置 v3-1 本题选择
    setSelectedKey(null);

    // 重置 v2-9 判定锁
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
        const next = { ...prev, elapsedSec: (prev.elapsedSec ?? 0) + 1 };
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
  const stage = (session as any)?.stage ?? "-";

  const questions = useMemo(() => {
    if (!session) return [];
    return buildQuestions(session.subject, stage);
  }, [session?.subject, stage, session?.id]);

  const currentQuestion = useMemo(() => {
    if (!session) return null;
    const idx = Math.min(session.currentIndex ?? 0, questions.length - 1);
    return questions[idx] ?? null;
  }, [session, questions]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return (session.hintUsed ?? 0) < (session.hintLimit ?? 5);
  }, [session]);

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  }, [session]);

  const isFinished = useMemo(() => {
    return answeredCount >= TOTAL_QUESTIONS;
  }, [answeredCount]);

  const locked = useMemo(() => {
    // 暫停 or 延遲判定中 or 已完成，都鎖住作答
    return !session || session.paused || judging || isFinished;
  }, [session, judging, isFinished]);

  /* ================= 操作：暫停 ================= */
  function togglePause() {
    if (!session) return;

    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);

    // 不要改变题目选择，只清掉提示性 msg
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

    // demo：后续可改成题库/AI 提示
    setHintText("提示：先找關鍵字，再拆步驟，最後再判斷/計算。");
  }

  /* ================= v3-1：選項選擇 / 確定 / 判定 / 2 秒後下一題 ================= */
  function pickOption(key: string) {
    if (locked) return;
    setSelectedKey(key);
    setMsg(null);
  }

  function confirmAnswer() {
    if (!session) return;
    if (locked) return;
    if (!currentQuestion) {
      setMsg("題目讀取中，請稍後再試。");
      return;
    }
    if (!selectedKey) {
      setMsg("請先選擇一個選項，再按「確定」。");
      return;
    }

    const isCorrect = selectedKey === currentQuestion.answerKey;

    const next: PracticeSession = isCorrect
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
        if (newAnswered >= TOTAL_QUESTIONS) {
          return prev; // 已完成就停在完成页逻辑
        }

        const moved = { ...prev, currentIndex: (prev.currentIndex ?? 0) + 1 };
        寫入進度(moved);
        return moved;
      });

      // 重置本题状态
      setSelectedKey(null);
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

  /* ================= 完成畫面（v2-9 冻结） ================= */
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
            <span style={pill}>階段：{stage}</span>
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

  /* ================= UI（v2-9 冻结布局 + v3-1 题目区） ================= */
  return (
    <main style={wrap}>
      {/* ✅ v2-9：回上一頁固定右上（靠近「關於」右側） */}
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
            <span style={pill}>階段：{stage}</span>
            <span style={pill}>
              第 {Math.min((session.currentIndex ?? 0) + 1, TOTAL_QUESTIONS)} / {TOTAL_QUESTIONS} 題
            </span>
          </div>

          {/* 右側：計時 + 暫停（冻结） */}
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

        {/* 暫停提示 */}
        {session.paused ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff8e6" }}>
            已暫停；請按「繼續」後再作答。
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== v3-1 題目區（新增，不动其他卡）===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 10 }}>題目</div>

        {currentQuestion ? (
          <>
            <div style={{ fontSize: 18, lineHeight: 1.8, marginBottom: 10 }}>
              {currentQuestion.title}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {currentQuestion.choices.map((c) => {
                const active = selectedKey === c.key;
                return (
                  <button
                    key={c.key}
                    disabled={locked}
                    onClick={() => pickOption(c.key)}
                    style={{
                      ...btn,
                      textAlign: "left",
                      border: active ? "1px solid #111" : "1px solid #ddd",
                      opacity: locked ? 0.5 : 1,
                    }}
                  >
                    {c.key}. {c.text}
                  </button>
                );
              })}
            </div>

            <div style={{ height: 12 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                <button
                  style={{
                    ...btnPrimary,
                    opacity: locked || !selectedKey ? 0.5 : 1,
                    cursor: locked || !selectedKey ? "not-allowed" : "pointer",
                  }}
                  disabled={locked || !selectedKey}
                  onClick={confirmAnswer}
                >
                  確定
                </button>

                <span style={pill}>{selectedKey ? `已選：${selectedKey}` : "尚未選擇"}</span>
              </div>

              {/* ✅ 对/错累计（不归零） */}
              <div style={{ display: "flex", gap: 8 }}>
                <span style={pill}>對：{session.correctCount ?? 0}</span>
                <span style={pill}>錯：{session.wrongCount ?? 0}</span>
              </div>
            </div>

            {msg ? (
              <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div>
            ) : null}
          </>
        ) : (
          <div style={{ opacity: 0.7 }}>題目讀取中…</div>
        )}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區（v2-9 冻结：拿掉「提示」標題，左上顯示提示 + 次數，右側塗鴉牆）===== */}
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
              {session.hintUsed ?? 0}/{session.hintLimit ?? 5}
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
          {hintText ? hintText : "尚未使用提示。"}
        </div>
      </div>

      {/* ✅ Whiteboard 本體 */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}