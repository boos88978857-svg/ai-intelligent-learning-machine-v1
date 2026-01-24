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

/* ================= 基本樣式（保持精簡、好排版） ================= */
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

/** v3-1：先用「可跑的假題庫」把題目顯示打通（之後再換真題庫/AI） */
function getMockQuestion(subject: Subject, stage: string, idx: number): MockQuestion {
  // 你目前以「每回合 20 題」為主
  const n = (idx % 20) + 1;

  // 英文：簡單單字選擇題示範（APPLIED 也能用同一套先跑）
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

  // 數學：簡單運算題（先用選擇題形式，保持同一作答規格）
  if (subject === "數學") {
    const a = (idx % 9) + 1;
    const b = ((idx + 3) % 9) + 1;
    const ans = a + b;
    const choices = [ans, ans + 1, ans - 1, ans + 2].map(String);
    return {
      id: `math-${stage}-${idx}`,
      subject,
      stage,
      prompt: `第 ${n} 題（${stage}）：${a} + ${b} = ?`,
      choices,
      answerIndex: 0,
      hint: "先把個位數相加",
    };
  }

  // 其他：通用示範題
  return {
    id: `other-${stage}-${idx}`,
    subject,
    stage,
    prompt: `第 ${n} 題（${stage}）：這是一題示範題，請選擇「正確」。`,
    choices: ["正確", "錯誤", "不知道", "跳過"],
    answerIndex: 0,
    hint: "示範題就是選「正確」",
  };
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // v3-1：選項 + 確認
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  const timerRef = useRef<number | null>(null);
  const autoNextRef = useRef<number | null>(null);

  const stage = useMemo(() => String((session as any)?.stage ?? ""), [session]);

  // 題目：由 subject/stage/currentIndex 產生（先打通顯示）
  const question = useMemo(() => {
    if (!session) return null;
    return getMockQuestion(session.subject, stage || "-", session.currentIndex);
  }, [session, stage]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return session.hintUsed < session.hintLimit;
  }, [session]);

  function backToPractice() {
    // 不帶參數回去，避免 /practice 自動建立新進度造成閃跳
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

    setSession(s);
    setSelectedIndex(null);
    setAnswered(false);
    setMsg(null);
    setHintText(null);
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

  function togglePause() {
    if (!session) return;
    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);
  }

  function onHint() {
    if (!session) return;

    if (!canHint) {
      setHintText("提示次數已用完");
      return;
    }

    const next = { ...session, hintUsed: session.hintUsed + 1 };
    寫入進度(next);
    setSession(next);

    // v3-1：優先用題目自身 hint，沒有就用通用
    const ht = question?.hint ? `提示：${question.hint}` : "提示：先找關鍵字，再判斷/計算。";
    setHintText(ht);
  }

  // ✅ 行為規則：暫停時全部不可作答；未作答不可前進；確認後 2 秒自動下一題
  const canSelect = !!session && !session.paused && !answered;
  const canConfirm = !!session && !session.paused && !answered && selectedIndex !== null;
  const canNext = !!session && !session.paused && answered;

  function confirmAnswer() {
    if (!session || !question) return;
    if (!canConfirm) return;

    const isCorrect = selectedIndex === question.answerIndex;

    const next = {
      ...session,
      correctCount: session.correctCount + (isCorrect ? 1 : 0),
      wrongCount: session.wrongCount + (!isCorrect ? 1 : 0),
    };

    寫入進度(next);
    setSession(next);
    setAnswered(true);

    setMsg(isCorrect ? "答對了！即將進入下一題…" : "很可惜沒有答對，即將進入下一題…");

    // 2 秒後自動下一題
    if (autoNextRef.current) window.clearTimeout(autoNextRef.current);
    autoNextRef.current = window.setTimeout(() => {
      goNext();
    }, 2000);
  }

  function goNext() {
    if (!session) return;
    if (session.paused) return; // 暫停鎖住

    // v3-1：每回合 20 題（到 20 題就結束畫面）
    if (session.currentIndex >= 19) {
      setMsg("本回合已完成 20 題！");
      return;
    }

    const next = { ...session, currentIndex: session.currentIndex + 1 };
    寫入進度(next);
    setSession(next);

    setSelectedIndex(null);
    setAnswered(false);
    setHintText(null);
    setMsg(null);
  }

  // 清理 timeout
  useEffect(() => {
    return () => {
      if (autoNextRef.current) window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    };
  }, []);

  if (!session) {
    return (
      <main style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>讀取中…</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>若一直停在這裡，請回到 /practice 重新進入。</div>
        </div>
      </main>
    );
  }

  const finished = session.currentIndex >= 19 && answered;

  // --- 下面接第 2 段 ---

  /* ================= UI ================= */
  return (
    <main style={wrap}>
      {/* ===== 頂部狀態（精簡排版）===== */}
      <div style={card}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>第 {session.currentIndex + 1} / 20 題</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>⏱ {格式化時間(session.elapsedSec)}</span>

            {/* ✅ 暫停改成 pill 風格，和計時一致 */}
            <button onClick={togglePause} style={pillBtn}>
              {session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>

            {/* ✅ 回上一頁（回學習區） */}
            <button style={btn} onClick={backToPractice}>
              ← 回上一頁
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

      {/* ===== 題目區 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>題目</div>
        <div style={{ lineHeight: 1.8, fontSize: 16 }}>
          {question ? question.prompt : "題目載入中…"}
        </div>

        <div style={{ height: 10 }} />

        {/* 選項（選擇題） */}
        <div style={{ display: "grid", gap: 10 }}>
          {(question?.choices ?? []).map((c, i) => {
            const selected = selectedIndex === i;
            return (
              <button
                key={i}
                onClick={() => {
                  if (!canSelect) return;
                  setSelectedIndex(i);
                }}
                style={{
                  ...btn,
                  textAlign: "left",
                  border: selected ? "1px solid #111" : "1px solid #ddd",
                  background: selected ? "#f0f0f0" : "#fff",
                  cursor: canSelect ? "pointer" : "not-allowed",
                  opacity: canSelect ? 1 : 0.6,
                }}
              >
                {String.fromCharCode(65 + i)}. {c}
              </button>
            );
          })}
        </div>

        <div style={{ height: 10 }} />

        {/* ✅ 確定 / 下一題（確定後 2 秒自動下一題；也保留手動下一題） */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={{ ...btnPrimary, opacity: canConfirm ? 1 : 0.5 }} disabled={!canConfirm} onClick={confirmAnswer}>
              確定
            </button>

            <button style={{ ...btn, opacity: canNext ? 1 : 0.5 }} disabled={!canNext} onClick={goNext}>
              下一題 →
            </button>
          </div>

          {/* 對/錯放在作答區右邊（省空間） */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={pill}>對：{session.correctCount}</span>
            <span style={pill}>錯：{session.wrongCount}</span>
          </div>
        </div>

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>
            {msg}
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區（提示次數放在標題旁） ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <span>提示</span>
          <span style={pill}>
            {session.hintUsed}/{session.hintLimit}
          </span>
        </div>

        <div style={row}>
          <button onClick={onHint} disabled={!canHint} style={{ ...btn, opacity: canHint ? 1 : 0.5 }}>
            顯示提示
          </button>

          <button style={btn} onClick={() => setWhiteboardOpen(true)}>
            📝 塗鴉牆
          </button>
        </div>

        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: "1px dashed #e0e0e0" }}>
          {hintText ? <div style={{ lineHeight: 1.8 }}>{hintText}</div> : <div style={{ opacity: 0.7 }}>尚未使用提示。</div>}
        </div>
      </div>

      {/* ===== 回合完成 ===== */}
      {finished ? (
        <div style={{ height: 10 }} />
      ) : null}

      {finished ? (
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 8 }}>本回合完成 ✅</div>
          <div style={{ opacity: 0.8, lineHeight: 1.8 }}>
            你已完成 20 題。<br />
            對：{session.correctCount} ／ 錯：{session.wrongCount}
          </div>
          <div style={{ height: 10 }} />
          <button style={btnPrimary} onClick={backToPractice}>
            回到學習區
          </button>
        </div>
      ) : null}

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}