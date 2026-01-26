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

import { getQuestionByIndex, getStageCount, type Question } from "./question-bank";

// ✅ v3-3：錯題本（依 科目 -> 階段 分桶）
import { addWrongQuestion } from "../../../lib/wrong-book";

/* ================= 基本樣式（沿用 v2-9 基底，不亂動） ================= */
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

/* ✅ 题目区浮水印（v3-1 Step3：动态） */
const watermarkBase: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: "50%",
  transform: "translate(-50%, -50%)",
  fontSize: 34,
  fontWeight: 900,
  letterSpacing: 10,
  fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display'",
  pointerEvents: "none",
  userSelect: "none",
  whiteSpace: "nowrap",
  transition: "opacity 240ms ease, filter 240ms ease",
};

function getWatermarkStyle(wmVisible: boolean, wmTone: "normal" | "wrong"): React.CSSProperties {
  const isWrong = wmTone === "wrong";
  return {
    ...watermarkBase,
    opacity: wmVisible ? 0.06 : 0,
    color: isWrong ? "rgba(220, 38, 38, 1)" : "rgba(17, 17, 17, 1)",
    textShadow: isWrong ? "0 0 1px rgba(220,38,38,0.35)" : "none",
    filter: isWrong ? "none" : "grayscale(1)",
  };
}

/* ================= 常數 ================= */
const TOTAL_QUESTIONS = 20;

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v3-1：题目与选项状态
  const [pickedChoice, setPickedChoice] = useState<string | null>(null);

  // ✅ Step4：答错才开放“下一题”按钮；且答错后不允许改答案重做
  const [canGoNext, setCanGoNext] = useState(false);

  // judging：提交后锁定题目区
  const [judging, setJudging] = useState(false);

  // 自动下一题 timer
  const nextTimerRef = useRef<number | null>(null);

  // ✅ 浮水印动态
  const [wmVisible, setWmVisible] = useState(true);
  const [wmTone, setWmTone] = useState<"normal" | "wrong">("normal");
  const wmFadeTimerRef = useRef<number | null>(null);
  const wmToneTimerRef = useRef<number | null>(null);

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

  // ✅ 浮水印 helper
  function clearWmTimers() {
    if (wmFadeTimerRef.current) window.clearTimeout(wmFadeTimerRef.current);
    if (wmToneTimerRef.current) window.clearTimeout(wmToneTimerRef.current);
    wmFadeTimerRef.current = null;
    wmToneTimerRef.current = null;
  }

  function wmFadeOnQuestionChange() {
    // 題目切換：淡出 -> 再淡入
    clearWmTimers();
    setWmVisible(false);
    wmFadeTimerRef.current = window.setTimeout(() => {
      setWmVisible(true);
      wmFadeTimerRef.current = null;
    }, 60);
  }

  function wmPulseOnWrong(durationMs: number) {
    // 答錯：短暫變紅，之後恢復
    if (wmToneTimerRef.current) {
      window.clearTimeout(wmToneTimerRef.current);
      wmToneTimerRef.current = null;
    }
    setWmTone("wrong");
    wmToneTimerRef.current = window.setTimeout(() => {
      setWmTone("normal");
      wmToneTimerRef.current = null;
    }, durationMs);
  }

  function wmResetNow() {
    // ✅ 你反映的「按下一題紅色卡住」：按下一題就立刻恢復
    if (wmToneTimerRef.current) {
      window.clearTimeout(wmToneTimerRef.current);
      wmToneTimerRef.current = null;
    }
    setWmTone("normal");
  }

  // ✅ 题目切换时：浮水印 fade
  useEffect(() => {
    if (!session) return;
    wmFadeOnQuestionChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.subject, (session as any)?.stage, session?.currentIndex]);

  // ✅ 离开页：清浮水印 timers
  useEffect(() => {
    return () => {
      clearWmTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // reset UI
    setMsg(null);
    setHintText(null);
    setPickedChoice(null);
    setJudging(false);
    setCanGoNext(false);
    clearNextTimer();
    wmResetNow();
  }, [router, sp]);

  /* ================= 計算狀態 ================= */
  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  }, [session]);

  const isFinished = useMemo(() => answeredCount >= TOTAL_QUESTIONS, [answeredCount]);

  const hintLimit = useMemo(() => {
    // 固定 5 次：若 session.hintLimit 有值就用它，沒有就 fallback 5
    return (session?.hintLimit ?? 5) as number;
  }, [session]);

  const canHint = useMemo(() => {
    if (!session) return false;
    const used = session.hintUsed ?? 0;
    return used < hintLimit;
  }, [session, hintLimit]);

  // 锁定题目区选择：暂停/判定中/完成/已提交后（judging）
  const locked = useMemo(() => {
    return !session || session.paused || judging || isFinished;
  }, [session, judging, isFinished]);

  /* ================= 題目取得（v3-1） ================= */
  const stage = useMemo(() => ((session as any)?.stage ?? "") as string, [session]);
  const subject = useMemo(() => (session?.subject ?? "") as string, [session]);

  const q: Question | null = useMemo(() => {
    if (!session) return null;
    return getQuestionByIndex(subject, stage, session.currentIndex ?? 0);
  }, [session, subject, stage]);

  const stageCount = useMemo(() => {
    if (!session) return 0;
    return getStageCount(subject, stage);
  }, [session, subject, stage]);

  // 把 prompt 第一行搬到题干旁（规则：Choose/選擇 开头）
  const promptParts = useMemo(() => {
    const raw = q?.prompt ?? "";
    const lines = raw.split("\n");
    const first = (lines[0] ?? "").trim();
    const rest = lines.slice(1).join("\n").trim();

    const looksLikeStem =
      /^choose\b/i.test(first) ||
      /^選擇/.test(first) ||
      /^請選擇/.test(first) ||
      /^選出/.test(first) ||
      /^choose the\b/i.test(first);

    return {
      stem: looksLikeStem ? first : "",
      body: looksLikeStem ? rest : raw,
    };
  }, [q]);

  /* ================= 計時（僅在未暫停 & 未完成時） ================= */
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (session.paused) return;
    if (isFinished) return;

    timerRef.current = window.setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;

        const done = (prev.correctCount ?? 0) + (prev.wrongCount ?? 0) >= TOTAL_QUESTIONS;
        if (done) return prev;

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
  }, [session?.id, session?.paused, isFinished]);

  /* ================= 操作：暫停 ================= */
  function togglePause() {
    if (!session) return;
    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);
    setMsg(null);
  }

  /* ================= 操作：提示（次数 5） ================= */
  function onHint() {
    if (!session) return;
    if (session.paused) return;

    const used = session.hintUsed ?? 0;
    if (used >= hintLimit) {
      setHintText("提示次數已用完");
      return;
    }

    const next = { ...session, hintUsed: used + 1, hintLimit };
    寫入進度(next);
    setSession(next);

    if (q?.hint) setHintText(q.hint);
    else setHintText("提示：先找關鍵字，再拆步驟，最後再判斷。");
  }

  /* ================= 作答（答對自動、答錯手動） ================= */
  function choose(choice: string) {
    if (locked) return;
    setPickedChoice(choice);
    setMsg(null);
  }

  function goNextCommonReset() {
    setPickedChoice(null);
    setJudging(false);
    setHintText(null);
    setMsg(null);
    setCanGoNext(false);
    wmResetNow();
  }

  function goNextManual() {
    if (!session) return;

    // ✅ 手動下一題前，把紅色浮水印立刻復原（避免卡住）
    wmResetNow();

    setSession((prev) => {
      if (!prev) return prev;

      const newAnswered = (prev.correctCount ?? 0) + (prev.wrongCount ?? 0);
      if (newAnswered >= TOTAL_QUESTIONS) return prev;

      const moved = { ...prev, currentIndex: (prev.currentIndex ?? 0) + 1 };
      寫入進度(moved);
      return moved;
    });

    goNextCommonReset();
  }

  function confirmAnswer() {
    if (!session) return;
    if (session.paused) return;
    if (judging) return;
    if (isFinished) return;

    if (!q) {
      setMsg("本階段暫時沒有題目。");
      return;
    }
    if (!pickedChoice) {
      setMsg("請先選擇答案，再按「確定」。");
      return;
    }

    const isCorrect = pickedChoice === q.answer;

    // 先写入对错
    const next = isCorrect
      ? { ...session, correctCount: (session.correctCount ?? 0) + 1 }
      : { ...session, wrongCount: (session.wrongCount ?? 0) + 1 };

    寫入進度(next);
    setSession(next);

    // ✅ 提交后锁定（不允许改答案重做）
    setJudging(true);

    if (isCorrect) {
      setMsg("✅ 正確。準備進入下一題…");
      setCanGoNext(false);

      clearNextTimer();
      nextTimerRef.current = window.setTimeout(() => {
        setSession((prev) => {
          if (!prev) return prev;

          const newAnswered = (prev.correctCount ?? 0) + (prev.wrongCount ?? 0);
          if (newAnswered >= TOTAL_QUESTIONS) return prev;

          const moved = { ...prev, currentIndex: (prev.currentIndex ?? 0) + 1 };
          寫入進度(moved);
          return moved;
        });

        goNextCommonReset();
      }, 1800);
    } else {
      // ✅ 答错：写入错题本（依 subject -> stage 分桶）
      addWrongQuestion(subject, stage, q.id);

      setMsg("❌ 錯誤。本題已記錄至錯題本；按「下一題」繼續。");
      setCanGoNext(true);

      // ✅ 红色浮水印提示（你要跟自動時間一致就用 1800）
      wmPulseOnWrong(1800);
    }
  }

  // 離開頁面時清除 timer
  useEffect(() => {
    return () => {
      clearNextTimer();
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
      clearWmTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= 完成畫面 ================= */
  if (session && isFinished) {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

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

            <span style={pill}>
              第 {Math.min((session.currentIndex ?? 0) + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}
            </span>
          </div>

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

      {/* ===== 題目區（題庫）===== */}
      <div style={{ ...card, position: "relative" }}>
        <div style={getWatermarkStyle(wmVisible, wmTone)}>題目區</div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 10,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            {promptParts.stem ? <div style={{ opacity: 0.75 }}>{promptParts.stem}</div> : null}
          </div>
          <div />
        </div>

        <div style={{ opacity: 0.95, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {promptParts.body || q?.prompt || "（此階段暫無題目）"}
        </div>

        <div style={{ height: 10 }} />

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(q?.choices ?? []).map((c) => {
            const active = pickedChoice === c;
            return (
              <button
                key={c}
                style={{
                  ...btn,
                  textAlign: "left",
                  border: active ? "1px solid #111" : "1px solid #ddd",
                  opacity: locked ? 0.55 : 1,
                }}
                onClick={() => choose(c)}
                disabled={locked}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div style={{ height: 10 }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={{
              ...btnPrimary,
              opacity: session.paused || judging || isFinished || !pickedChoice ? 0.5 : 1,
              cursor: session.paused || judging || isFinished || !pickedChoice ? "not-allowed" : "pointer",
            }}
            onClick={confirmAnswer}
            disabled={session.paused || judging || isFinished || !pickedChoice}
          >
            確定
          </button>

          <button
            style={{
              ...btn,
              opacity: canGoNext ? 1 : 0.35,
              cursor: canGoNext ? "pointer" : "not-allowed",
            }}
            onClick={goNextManual}
            disabled={!canGoNext}
          >
            下一題 →
          </button>

          <button style={btn} onClick={() => setWhiteboardOpen(true)} disabled={session.paused}>
            📝 塗鴉牆
          </button>
        </div>

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div>
        ) : null}

        {stageCount === 0 ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff8e6" }}>
            ⚠️ 這個階段目前題庫數量為 0，請確認 question-bank.ts 的 subject/stage 名稱是否一致。
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區（顯示提示 + 次數 + 對/錯 固定同一排）===== */}
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
              {session.hintUsed ?? 0}/{hintLimit}
            </span>

            <span style={pill}>對 {session.correctCount ?? 0}</span>
            <span style={pill}>錯 {session.wrongCount ?? 0}</span>
          </div>

          <div />
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
          {hintText ? hintText : "提示可在作答前使用，協助理解題目。"}
        </div>
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}