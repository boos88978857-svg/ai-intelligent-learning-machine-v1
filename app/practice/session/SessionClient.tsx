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

/* ================= 基本樣式 ================= */
const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "8px 0" };

const card: React.CSSProperties = {
  padding: 14,
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
  lineHeight: 1.2,
  whiteSpace: "nowrap",
};

const pillBtn: React.CSSProperties = {
  ...pill,
  cursor: "pointer",
  background: "#fff",
};

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
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

type MockQuestion = {
  id: string;
  subject: Subject;
  stage?: string;
  prompt: string;
  choices: string[];
  answerIndex: number;
  hint?: string;
};

function getMockQuestion(subject: Subject, stage: string, idx: number): MockQuestion {
  const n = (idx % 20) + 1;

  if (subject === "英文") {
    const bank = [
      { prompt: "選出「藍色」的英文：", choices: ["blue", "apple", "run", "happy"], answerIndex: 0, hint: "顏色單字" },
      { prompt: "選出「蘋果」的英文：", choices: ["table", "apple", "walk", "green"], answerIndex: 1, hint: "水果單字" },
      { prompt: "選出「跑步」的英文：", choices: ["sleep", "run", "cold", "book"], answerIndex: 1, hint: "動作單字" },
      { prompt: "選出「快樂」的英文：", choices: ["sad", "happy", "angry", "hungry"], answerIndex: 1, hint: "情緒單字" },
    ];
    const q = bank[idx % bank.length];
    return {
      id: `en-${stage}-${idx}`,
      subject,
      stage,
      prompt: `第 ${n} 題（${stage}）：${q.prompt}`,
      choices: q.choices,
      answerIndex: q.answerIndex,
      hint: q.hint,
    };
  }

  if (subject === "數學") {
    const a = (idx % 9) + 1;
    const b = ((idx + 3) % 9) + 1;
    const ans = a + b;
    const choices = [ans, ans + 1, ans - 1, ans + 2].map((x) => String(x));
    return {
      id: `ma-${stage}-${idx}`,
      subject,
      stage,
      prompt: `第 ${n} 題（${stage}）：${a} + ${b} = ?`,
      choices,
      answerIndex: 0,
      hint: "先把兩個數相加。",
    };
  }

  // 其他
  return {
    id: `ot-${stage}-${idx}`,
    subject,
    stage,
    prompt: `第 ${n} 題（${stage}）：示範題`,
    choices: ["A", "B", "C", "D"],
    answerIndex: 0,
    hint: "示範提示。",
  };
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // 作答流程狀態
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [locked, setLocked] = useState(false); // 按下「確定」後鎖定，2 秒後自動下一題
  const [msg, setMsg] = useState<string | null>(null);

  // 提示
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  const timerRef = useRef<number | null>(null);
  const nextTimerRef = useRef<number | null>(null);

  // ✅ 提示次數固定 5 次（你要求）
  const HINT_LIMIT = 5;

  const stage = useMemo(() => String((session as any)?.stage ?? "").trim() || "A1", [session]);
  const subject = useMemo(() => (session?.subject ?? "英文") as Subject, [session]);

  const question = useMemo(() => {
    if (!session) return null;
    return getMockQuestion(subject, stage, session.currentIndex ?? 0);
  }, [session, subject, stage]);

  /* ================= 讀取進度（只在 id 變更時） ================= */
  const sessionId = sp.get("id") || "";
  useEffect(() => {
    const id = sessionId || 取得目前進度id();

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
    setSelectedIndex(null);
    setLocked(false);
    setMsg(null);
    setHintText(null);
  }, [router, sessionId]);

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
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [session?.id, session?.paused]);

  /* ================= 內部工具 ================= */
  function backToPractice() {
    router.replace("/practice");
  }

  function togglePause() {
    setSession((prev) => {
      if (!prev) return prev;
      const next = { ...prev, paused: !prev.paused };
      寫入進度(next);
      return next;
    });
  }

  // ✅ 這裡不看 session.hintLimit，直接用固定 5 次
  const canHint = useMemo(() => {
    if (!session) return false;
    const used = Number(session.hintUsed ?? 0);
    return used < HINT_LIMIT && !session.paused;
  }, [session]);

  function onHint() {
    if (!session) return;
    if (!canHint) {
      setHintText("提示次數已用完。");
      return;
    }

    setSession((prev) => {
      if (!prev) return prev;
      const used = Number(prev.hintUsed ?? 0) + 1;
      const next = { ...prev, hintUsed: used };
      寫入進度(next);
      return next;
    });

    setHintText(question?.hint ? `提示：${question.hint}` : "提示：請先找關鍵字，再判斷答案。");
  }

  // ✅ 確定後：判定對錯 → 累計 → 鎖定 2 秒 → 自動下一題
  function onConfirm() {
    if (!session || !question) return;
    if (session.paused) return;
    if (locked) return;
    if (selectedIndex === null) {
      setMsg("請先選擇一個答案。");
      return;
    }

    setLocked(true);

    const isCorrect = selectedIndex === question.answerIndex;

    setSession((prev) => {
      if (!prev) return prev;
      const next = {
        ...prev,
        correctCount: Number(prev.correctCount ?? 0) + (isCorrect ? 1 : 0),
        wrongCount: Number(prev.wrongCount ?? 0) + (!isCorrect ? 1 : 0),
      };
      寫入進度(next);
      return next;
    });

    setMsg(isCorrect ? "✅ 答對！2 秒後自動下一題…" : "❌ 答錯！2 秒後自動下一題…");

    if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);

    nextTimerRef.current = window.setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;
        // 若中途被暫停，就不自動跳
        if (prev.paused) return prev;

        const next = { ...prev, currentIndex: Number(prev.currentIndex ?? 0) + 1 };
        寫入進度(next);
        return next;
      });

      setSelectedIndex(null);
      setLocked(false);
      setMsg(null);
      setHintText(null);
    }, 2000);
  }

  useEffect(() => {
    return () => {
      if (nextTimerRef.current) window.clearTimeout(nextTimerRef.current);
      nextTimerRef.current = null;
    };
  }, []);

  /* ================= 空狀態 ================= */
  if (!session) {
    return (
      <main style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>讀取中…</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>若一直停在這裡，請回到學習區重新進入。</div>
        </div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      {/* ===== 頂部狀態：固定兩排，避免手機換行亂跳 ===== */}
      <div style={card}>
        {/* 第一排：科目/階段/題號 + 回上一頁（右側） */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>第 {(session.currentIndex ?? 0) + 1} / 20 題</span>
          </div>

          <button style={btn} onClick={backToPractice}>
            ← 回上一頁
          </button>
        </div>

        {/* 第二排：計時 + 暫停（放你指定的原回上一頁位置附近） */}
        <div style={{ marginTop: 8, display: "flex", justifyContent: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <span style={pill}>⏱ {格式化時間(session.elapsedSec ?? 0)}</span>

          <button onClick={togglePause} style={pillBtn}>
            {session.paused ? "▶ 繼續" : "⏸ 暫停"}
          </button>

          {session.paused ? (
            <span style={{ ...pill, background: "#fff8e6" }}>已暫停</span>
          ) : null}
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 題目區 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>題目</div>

        <div style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 12 }}>
          {question ? question.prompt : "（暫無題目）"}
        </div>

        {question ? (
          <div style={{ display: "grid", gap: 10 }}>
            {question.choices.map((c, i) => {
              const selected = selectedIndex === i;
              return (
                <button
                  key={i}
                  style={{
                    ...btn,
                    textAlign: "left",
                    border: selected ? "1px solid #111" : "1px solid #ddd",
                    background: selected ? "#f1f1f1" : "#fff",
                    opacity: session.paused || locked ? 0.6 : 1,
                    cursor: session.paused || locked ? "not-allowed" : "pointer",
                  }}
                  disabled={session.paused || locked}
                  onClick={() => setSelectedIndex(i)}
                >
                  {String.fromCharCode(65 + i)}. {c}
                </button>
              );
            })}
          </div>
        ) : null}

        <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              style={btnPrimary}
              disabled={session.paused || locked}
              onClick={onConfirm}
            >
              確定
            </button>

            <button
              style={btn}
              disabled={true}
              title="自動下一題：請先選擇答案並按確定"
              onClick={() => {}}
            >
              下一題 →
            </button>
          </div>

          {/* 對/錯：累計顯示（不歸零） */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={pill}>對：{Number(session.correctCount ?? 0)}</span>
            <span style={pill}>錯：{Number(session.wrongCount ?? 0)}</span>
          </div>
        </div>

        {msg ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區：不顯示「提示」標題，左上就是「顯示提示」可點 + 0/5 ===== */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <button
            onClick={onHint}
            disabled={!canHint}
            style={{ ...btn, opacity: canHint ? 1 : 0.5 }}
          >
            顯示提示
          </button>

          <span style={pill}>
            {Number(session.hintUsed ?? 0)}/{HINT_LIMIT}
          </span>

          <button style={btn} onClick={() => setWhiteboardOpen(true)}>
            📝 塗鴉牆
          </button>
        </div>

        <div style={{ padding: 12, borderRadius: 12, border: "1px dashed #e0e0e0", opacity: hintText ? 1 : 0.7 }}>
          {hintText ? hintText : "尚未使用提示。"}
        </div>
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}