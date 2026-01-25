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