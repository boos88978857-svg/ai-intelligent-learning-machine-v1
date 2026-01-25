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
/** ✅ 方案B：答對後自動下一題延遲 */
const AUTO_NEXT_MS = 2000;

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v3-1 題目/作答狀態
  const [pickedChoice, setPickedChoice] = useState<string | null>(null); // 選到哪個選項
  const [judging, setJudging] = useState(false); // 按下確定後鎖住（避免連點）
  const [wrongOnce, setWrongOnce] = useState(false); // 本題是否已記過一次錯（避免錯誤一直加）
  const nextTimerRef = useRef<number | null>(null);

  // 計時
  const timerRef = useRef<number | null>(null);

  /* ================= 工具 ================= */
  function backToPractice() {
    // ✅ 不帶 query，避免 PracticeClient 自動建進度造成閃跳
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

    // 重置本題作答狀態
    setPickedChoice(null);
    setJudging(false);
    setWrongOnce(false);
    clearNextTimer();
  }, [router, sp]);

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
    // 暫停 or 判定中 or 已完成 → 鎖住
    return !session || session.paused || judging || isFinished;
  }, [session, judging, isFinished]);

  /* ================= 計時（僅在未暫停且未完成時） ================= */
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // ✅ 完成後停止計時
    if (session.paused || isFinished) return;

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

    // 暫停時收斂訊息（避免干擾）
    setMsg(null);
  }

  /* ================= 操作：提示（v3-1：仍然 demo 提示，之後接題庫 hint） ================= */
  function onHint(currentQ: Question | null) {
    if (!session) return;
    if (session.paused) return;

    if (!canHint) {
      setHintText("提示次數已用完");
      return;
    }

    const next = { ...session, hintUsed: session.hintUsed + 1 };
    寫入進度(next);
    setSession(next);

    // ✅ v3-1：若題庫有 hint，用題庫 hint；否則給通用提示
    setHintText(currentQ?.hint ?? "提示：先找關鍵字，再拆步驟，最後再判斷/計算。");
  }

  /* ================= v3-1 題目取得 ================= */
  const subject = session?.subject ?? "";
  const stage = (session as any)?.stage ?? "";
  const currentIndex = session?.currentIndex ?? 0;

  const currentQ = useMemo(() => {
    if (!session) return null;
    return getQuestionByIndex(subject, stage, currentIndex);
  }, [session, subject, stage, currentIndex]);

  // 將 prompt 第一行做成「題目旁邊的短句」，其餘內容放到下面
  const promptParts = useMemo(() => {
    const p = currentQ?.prompt ?? "";
    const lines = p.split("\n");
    const head = (lines[0] ?? "").trim();
    const rest = lines.slice(1).join("\n").trim();
    return { head, rest };
  }, [currentQ?.prompt]);

  /* ================= v3-1：確定判定（方案B） =================
     - 若答對：correct +1 → 顯示訊息 → 2秒後自動下一題
     - 若答錯：wrong +1（本題只記一次）→ 留在本題不跳 → 讓使用者再選再試
  ============================================================ */
  function confirmAnswer() {
    if (!session) return;
    if (locked) return;

    if (!currentQ) {
      setMsg("目前沒有題目（題庫不足或 stage 不匹配）。");
      return;
    }

    if (!pickedChoice) {
      setMsg("請先選擇答案，再按「確定」。");
      return;
    }

    setJudging(true);

    const isCorrect = pickedChoice === currentQ.answer;

    if (isCorrect) {
      // ✅ 答對：記分 → 顯示訊息 → 2秒後自動下一題
      const next = { ...session, correctCount: (session.correctCount ?? 0) + 1 };
      寫入進度(next);
      setSession(next);

      setMsg("答對了！2 秒後進入下一題…");

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

        // 重置本題狀態
        setPickedChoice(null);
        setJudging(false);
        setWrongOnce(false);
        setHintText(null);
        setMsg(null);
      }, AUTO_NEXT_MS);

      return;
    }

    // ❌ 答錯：本題只記一次 wrong，且不自動下一題
    if (!wrongOnce) {
      const next = { ...session, wrongCount: (session.wrongCount ?? 0) + 1 };
      寫入進度(next);
      setSession(next);
      setWrongOnce(true);
    }

    setMsg("很可惜沒有答對～你可以再想一下，重新選答案再按確定。");
    setJudging(false);
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

  // === 第 2 段从这里继续贴（不要删除这行注释） ===
  /* ================= UI ================= */
  return (
    <main style={wrap}>
      {/* ✅ 回上一頁：固定右上（你之前确认最稳） */}
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
            {/* ✅ 你说科目字样会挤：这里保持只显示「英文」即可（你自己已改过也OK） */}
            <span style={pill}>{session.subject}</span>
            <span style={pill}>{(session as any).stage ?? "-"}</span>
            <span style={pill}>第 {Math.min(session.currentIndex + 1, TOTAL_QUESTIONS)}/{TOTAL_QUESTIONS}</span>
          </div>

          {/* 右側：計時 + 暫停（保持在同一块） */}
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

      {/* ===== 提示區：把「顯示提示」放左上、旁边显示次数 ===== */}
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
              onClick={() => onHint(currentQ)}
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

      {/* ===== 題目區（v3-1）===== */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "baseline", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 900, fontSize: 20 }}>題目</div>
              {/* ✅ 把 “Choose the correct ...” 这种头行搬到题目旁边 */}
              {promptParts.head ? (
                <div style={{ opacity: 0.75, fontSize: 13 }}>{promptParts.head}</div>
              ) : null}
            </div>

            {/* ✅ 其余内容放下面，让题面更干净 */}
            <div style={{ marginTop: 10, whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
              {promptParts.rest ? promptParts.rest : "（本題沒有更多題目內容）"}
            </div>
          </div>

          {/* 右侧：累计对错（保持累计，不会每题归零） */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <span style={pill}>對：{session.correctCount}</span>
            <span style={pill}>錯：{session.wrongCount}</span>
          </div>
        </div>

        <div style={{ height: 10 }} />

        {/* ===== 作答（v3-1：单选）===== */}
        {currentQ ? (
          <>
            <div style={{ display: "grid", gap: 10 }}>
              {currentQ.choices.map((c) => {
                const selected = pickedChoice === c;
                return (
                  <button
                    key={c}
                    disabled={locked}
                    onClick={() => {
                      if (locked) return;
                      setPickedChoice(c);
                      setMsg(null);
                    }}
                    style={{
                      ...btn,
                      textAlign: "left",
                      border: selected ? "1px solid #111" : btn.border,
                      opacity: locked ? 0.5 : 1,
                    }}
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
                  opacity: locked || !pickedChoice ? 0.5 : 1,
                  cursor: locked || !pickedChoice ? "not-allowed" : "pointer",
                }}
                onClick={confirmAnswer}
                disabled={locked || !pickedChoice}
              >
                確定
              </button>

              {/* ✅ 方案B：答错不跳，让用户再试；所以不提供“下一题”按钮 */}
              {/* 后续 v3-2 如果你想要“跳过/看解析”我们再加 */}
            </div>
          </>
        ) : (
          <div style={{ opacity: 0.75, lineHeight: 1.8 }}>
            目前這個階段沒有題目（請確認 question-bank.ts 裡有此 subject + stage 的題目）。
          </div>
        )}

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div>
        ) : null}
      </div>

      {/* ✅ Whiteboard 本體 */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}
