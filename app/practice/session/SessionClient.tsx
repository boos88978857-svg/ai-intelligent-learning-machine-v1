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
  top: 74, // 贴近顶部导航列
  zIndex: 999,
  ...btnGhost,
};

/* ================= 常數 ================= */
const TOTAL_QUESTIONS = 20;
const HINT_LIMIT = 5;

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v3-1：選項作答狀態（方案B：顯示判定/正解後，手動下一題）
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [judged, setJudged] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // 計時
  const timerRef = useRef<number | null>(null);

  /* ================= 工具 ================= */
  function backToPractice() {
    router.replace("/practice");
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

    // ✅ 固定提示次數為 5（保持基底不變，只做數值修正）
    const normalized =
      s.hintLimit === HINT_LIMIT ? s : { ...s, hintLimit: HINT_LIMIT };

    if (normalized !== s) {
      寫入進度(normalized);
    }

    setSession(normalized);

    // 重置 UI
    setMsg(null);
    setHintText(null);
    setSelectedChoice(null);
    setJudged(false);
    setIsCorrect(null);
  }, [router, sp]);

  /* ================= 計算狀態 ================= */
  const stage = useMemo(() => {
    return (session as any)?.stage ?? "-";
  }, [session]);

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  }, [session]);

  const isFinished = useMemo(() => answeredCount >= TOTAL_QUESTIONS, [answeredCount]);

  const qIndexForShow = useMemo(() => {
    if (!session) return 1;
    const n = Math.min(answeredCount + 1, TOTAL_QUESTIONS);
    return n;
  }, [session, answeredCount]);

  const question: Question | null = useMemo(() => {
    if (!session) return null;
    return getQuestionByIndex(session.subject, stage, answeredCount);
  }, [session, stage, answeredCount]);

  const locked = useMemo(() => {
    return !session || session.paused || isFinished;
  }, [session, isFinished]);

  const canHint = useMemo(() => {
    if (!session) return false;
    if (session.paused) return false;
    if (judged) return false; // 判定後不再給提示（避免下一題前亂加）
    return session.hintUsed < session.hintLimit;
  }, [session, judged]);

  /* ================= 計時（未暫停 & 未完成 才跑） ================= */
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
        // 已完成就不要再加秒（保險）
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

  /* ================= 操作：暫停 ================= */
  function togglePause() {
    if (!session) return;

    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);

    // 暫停時把提示訊息收斂
    setMsg(null);
  }

  /* ================= 操作：提示 ================= */
  function onHint() {
    if (!session) return;
    if (!canHint) return;

    const next = { ...session, hintUsed: session.hintUsed + 1 };
    寫入進度(next);
    setSession(next);

    // v3-1：提示優先用題目自帶 hint
    setHintText(question?.hint ?? "提示：先找關鍵字，再拆步驟，最後再判斷。");
  }

  /* ================= v3-1：選擇選項 ================= */
  function onSelectChoice(choice: string) {
    if (locked) return;
    if (judged) return; // 本題已判定就不讓改
    setSelectedChoice(choice);
    setMsg(null);
  }

  /* ================= v3-1：確定判定（方案B：顯示正解/說明，不自動跳） ================= */
  function confirmAnswer() {
    if (!session) return;
    if (locked) return;
    if (judged) return;

    if (!question) {
      setMsg("題目載入中或本階段題庫不足，請稍後再試。");
      return;
    }

    if (!selectedChoice) {
      setMsg("請先選擇一個答案，再按「確定」。");
      return;
    }

    const correct = selectedChoice === question.answer;
    const next = correct
      ? { ...session, correctCount: (session.correctCount ?? 0) + 1 }
      : { ...session, wrongCount: (session.wrongCount ?? 0) + 1 };

    寫入進度(next);
    setSession(next);

    setJudged(true);
    setIsCorrect(correct);

    // 訊息：只提示對/錯 + 正解（不要求重做）
    setMsg(correct ? "✅ 答對！" : `❌ 答錯。正確答案：${question.answer}`);
  }

  /* ================= v3-1：下一題（手動） ================= */
  function goNext() {
    if (!session) return;
    if (locked) return;
    if (!judged) {
      setMsg("請先按「確定」完成本題判定。");
      return;
    }

    const newAnswered = (session.correctCount ?? 0) + (session.wrongCount ?? 0);
    if (newAnswered >= TOTAL_QUESTIONS) return;

    const moved = { ...session, currentIndex: session.currentIndex + 1 };
    寫入進度(moved);
    setSession(moved);

    // 重置本題狀態
    setSelectedChoice(null);
    setJudged(false);
    setIsCorrect(null);
    setHintText(null);
    setMsg(null);
  }

  /* ================= 離開頁面清理 interval ================= */
  useEffect(() => {
    return () => {
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
      {/* ✅ 基底不动：右上固定「回上一页」 */}
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
          {/* 左側：主資訊（為了手機同排：不加「科目：」前綴，直接顯示值） */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>{session.subject}</span>
            <span style={pill}>{stage}</span>
            <span style={pill}>第 {qIndexForShow}/{TOTAL_QUESTIONS}</span>
          </div>

          {/* 右側：計時 + 暫停 */}
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

        {/* 暫停提示 */}
        {session.paused ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff8e6" }}>
            已暫停；請按「繼續」後再作答。
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區（基底不动：左上顯示提示 + 次數；右上塗鴉牆）===== */}
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
          {/* 左側：顯示提示 + 次數 + 對錯（你要把對錯放在提示後面） */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <button
              style={{ ...btn, opacity: canHint ? 1 : 0.5 }}
              onClick={onHint}
              disabled={!canHint}
            >
              顯示提示
            </button>

            <span style={pill}>
              {session.hintUsed}/{session.hintLimit}
            </span>

            {/* ✅ 對/錯移到提示 0/5 後面 */}
            <span style={pill}>對：{session.correctCount ?? 0}</span>
            <span style={pill}>錯：{session.wrongCount ?? 0}</span>
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
          {hintText ? hintText : "尚未使用提示"}
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 題目區（v3-1）===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 8 }}>題目</div>

        {/* 題幹：把 “Choose ...” 這段放到 題目旁邊/同區塊，避免往下擠 */}
        <div style={{ lineHeight: 1.8, fontSize: 18 }}>
          {question ? (
            <div style={{ whiteSpace: "pre-wrap" }}>{question.prompt}</div>
          ) : (
            <div style={{ opacity: 0.7 }}>題目載入中…</div>
          )}
        </div>

        <div style={{ height: 12 }} />

        {/* 選項 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {question?.choices?.map((c) => {
            const active = selectedChoice === c;
            const disabled = locked || judged;

            return (
              <button
                key={c}
                onClick={() => onSelectChoice(c)}
                disabled={disabled}
                style={{
                  ...btn,
                  textAlign: "left",
                  border: active ? "1px solid #111" : "1px solid #ddd",
                  opacity: disabled ? 0.6 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div style={{ height: 12 }} />

        {/* 操作列：確定 / 下一題（方案B：判定後才顯示下一題） */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={{
              ...btnPrimary,
              opacity: locked || judged ? 0.5 : 1,
              cursor: locked || judged ? "not-allowed" : "pointer",
            }}
            onClick={confirmAnswer}
            disabled={locked || judged}
          >
            確定
          </button>

          <button
            style={{
              ...btn,
              opacity: judged ? 1 : 0.5,
              cursor: judged ? "pointer" : "not-allowed",
            }}
            onClick={goNext}
            disabled={!judged}
          >
            下一題 →
          </button>
        </div>

        {/* 判定結果（方案B：顯示正解/說明，給用戶思考） */}
        {judged && question ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5", lineHeight: 1.8 }}>
            <div style={{ fontWeight: 800 }}>{isCorrect ? "✅ 本題答對" : "❌ 本題答錯"}</div>
            <div>正確答案：{question.answer}</div>
            {question.hint ? <div style={{ opacity: 0.85 }}>說明：{question.hint}</div> : null}
          </div>
        ) : null}

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div>
        ) : null}
      </div>

      {/* ✅ Whiteboard */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}