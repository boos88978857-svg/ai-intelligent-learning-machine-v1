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

// ✅ v3-1：題庫（同資料夾匯入）
import { getQuestionByIndex, getStageCount, type Question } from "./question-bank";

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
  top: 74, // 若你 navbar 高度不同，可微調
  zIndex: 999,
  ...btnGhost,
};

/* ================= 常數 ================= */
const AUTO_NEXT_MS = 1800; // ✅ 答對自動下一題延遲（1.5~2 秒之間）
const HINT_LIMIT_V3 = 5; // ✅ v3-1：提示次數改 5 次

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v3-1：題目狀態
  const [pickedChoice, setPickedChoice] = useState<string | null>(null); // 使用者選的選項文字
  const [judging, setJudging] = useState(false); // 判定中鎖定
  const [isWrong, setIsWrong] = useState(false); // 本題是否答錯（答錯：要手動下一題）

  const nextTimerRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  /* ================= 工具 ================= */
  function backToPractice() {
    router.replace("/practice"); // ✅ 不帶 query，避免自動建進度閃跳
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

    // ✅ v3-1：提示次數固定 5（不破壞舊資料，直接覆蓋成 5）
    if ((s as any).hintLimit !== HINT_LIMIT_V3) {
      (s as any).hintLimit = HINT_LIMIT_V3;
      // hintUsed 若超過新上限就裁掉
      if ((s as any).hintUsed > HINT_LIMIT_V3) (s as any).hintUsed = HINT_LIMIT_V3;
      寫入進度(s as any);
    }

    setSession(s);
    setMsg(null);
    setHintText(null);

    // v3-1：重置題目狀態
    setPickedChoice(null);
    setJudging(false);
    setIsWrong(false);
    clearNextTimer();
  }, [router, sp]);

  /* ================= 計時（僅在未暫停 & 未完成時） ================= */
  const stage = useMemo(() => ((session as any)?.stage ?? "").toString(), [session]);
  const subject = useMemo(() => (session?.subject ?? "").toString(), [session]);

  const totalQuestions = useMemo(() => {
    if (!subject || !stage) return 20;
    const c = getStageCount(subject, stage);
    return c > 0 ? c : 20;
  }, [subject, stage]);

  const answeredCount = useMemo(() => {
    if (!session) return 0;
    return (session.correctCount ?? 0) + (session.wrongCount ?? 0);
  }, [session]);

  const isFinished = useMemo(() => {
    return answeredCount >= totalQuestions;
  }, [answeredCount, totalQuestions]);

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
        // 若完成了就不再加秒
        const done = ((prev.correctCount ?? 0) + (prev.wrongCount ?? 0)) >= totalQuestions;
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
  }, [session?.id, session?.paused, isFinished, totalQuestions]);

  /* ================= 取得本題 ================= */
  const q: Question | null = useMemo(() => {
    if (!session) return null;
    if (!subject || !stage) return null;
    return getQuestionByIndex(subject, stage, session.currentIndex ?? 0);
  }, [session, subject, stage]);

  // 題目文字：把第一行（例如 Choose the correct word:）抽出，放到「題目」旁邊
  const promptParts = useMemo(() => {
    const raw = (q?.prompt ?? "").toString();
    const lines = raw.split("\n");
    if (lines.length <= 1) return { head: "", body: raw };
    const head = lines[0].trim();
    const body = lines.slice(1).join("\n").trim();
    return { head, body };
  }, [q]);

  /* ================= 狀態判斷 ================= */
  const canHint = useMemo(() => {
    if (!session) return false;
    if (session.paused) return false;
    return (session.hintUsed ?? 0) < (session.hintLimit ?? HINT_LIMIT_V3);
  }, [session]);

  // v3-1 行為規則：
  // - 作答需按「確定」
  // - 答對：1.8 秒自動下一題
  // - 答錯：顯示訊息 + 需手動按「下一題」
  const answered = useMemo(() => judging || isWrong, [judging, isWrong]);
  const locked = useMemo(() => {
    return !session || session.paused || isFinished || answered;
  }, [session, isFinished, answered]);

  /* ================= 操作：暫停 ================= */
  function togglePause() {
    if (!session) return;

    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);

    // 暫停時不清掉題目狀態，但提示訊息收斂
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

    // v3-1：優先用題庫的 hint
    setHintText(q?.hint ? q.hint : "提示：先找關鍵字，再拆步驟，最後再判斷/計算。");
  }

  /* ================= 作答：選擇 / 確定 / 下一題 ================= */
  function pick(choice: string) {
    if (!session) return;
    if (session.paused) return;
    if (isFinished) return;
    if (judging || isWrong) return; // 已判定就不再選
    setPickedChoice(choice);
    setMsg(null);
  }

  function confirm() {
    if (!session) return;
    if (session.paused) return;
    if (isFinished) return;
    if (judging || isWrong) return;

    if (!pickedChoice) {
      setMsg("請先選擇一個答案，再按「確定」。");
      return;
    }

    const correct = q ? pickedChoice === q.answer : false;

    // 寫入對/錯累計（不歸零）
    const next = correct
      ? { ...session, correctCount: (session.correctCount ?? 0) + 1 }
      : { ...session, wrongCount: (session.wrongCount ?? 0) + 1 };

    寫入進度(next);
    setSession(next);

    if (correct) {
      setJudging(true);
      setIsWrong(false);
      setMsg(`✅ 正確！${Math.round(AUTO_NEXT_MS / 100) / 10}s 後自動下一題…`);

      clearNextTimer();
      nextTimerRef.current = window.setTimeout(() => {
        setSession((prev) => {
          if (!prev) return prev;
          const done = ((prev.correctCount ?? 0) + (prev.wrongCount ?? 0)) >= totalQuestions;
          if (done) return prev;

          const moved = { ...prev, currentIndex: (prev.currentIndex ?? 0) + 1 };
          寫入進度(moved);
          return moved;
        });

        // 重置本題狀態
        setPickedChoice(null);
        setJudging(false);
        setIsWrong(false);
        setHintText(null);
        setMsg(null);
      }, AUTO_NEXT_MS);
    } else {
      // 答錯：不自動跳，給使用者思考；必須手動下一題
      setJudging(false);
      setIsWrong(true);
      setMsg("❌ 錯誤。你可以看提示後再按「下一題」繼續。");
    }
  }

  function nextManual() {
    if (!session) return;
    if (session.paused) return;
    if (isFinished) return;
    if (!isWrong) return; // 只有答錯才需要手動下一題

    const moved = { ...session, currentIndex: (session.currentIndex ?? 0) + 1 };
    寫入進度(moved);
    setSession(moved);

    // 重置本題狀態
    setPickedChoice(null);
    setJudging(false);
    setIsWrong(false);
    setHintText(null);
    setMsg(null);
  }

  // 離開頁面時清 timer
  useEffect(() => {
    return () => {
      clearNextTimer();
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, []);

  /* ================= 完成畫面（完成後秒數不再跑） ================= */
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
            <span style={pill}>題數：{totalQuestions}/{totalQuestions}</span>
            <span style={pill}>用時：{格式化時間(session.elapsedSec)}</span>
          </div>

          <div style={{ height: 8 }} />

          <div style={row}>
            <span style={pill}>對：{session.correctCount ?? 0}</span>
            <span style={pill}>錯：{session.wrongCount ?? 0}</span>
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
      {/* ✅ 固定右上：回上一頁（靠近「關於」右側） */}
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
          {/* 左側：英文 / A1 / 第 1/20（你已把「科目：」拿掉） */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>{session.subject}</span>
            <span style={pill}>{(session as any).stage ?? "-"}</span>
            <span style={pill}>
              第 {Math.min((session.currentIndex ?? 0) + 1, totalQuestions)}/{totalQuestions}
            </span>
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

        {session.paused ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff8e6" }}>
            已暫停；請按「繼續」後再作答。
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 題目區（v3-1：題庫）===== */}
      <div style={card}>
        {/* 題目標題列：把 prompt 第一行搬到「題目」旁邊 */}
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

          {/* ✅ 把對/錯放到提示次數後面（同一排、固定位置） */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={pill}>
              提示 {session.hintUsed ?? 0}/{session.hintLimit ?? HINT_LIMIT_V3}
            </span>
            <span style={pill}>對 {session.correctCount ?? 0}</span>
            <span style={pill}>錯 {session.wrongCount ?? 0}</span>
          </div>
        </div>

        <div style={{ opacity: 0.9, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {promptParts.body || q?.prompt || "（此階段暫無題目）"}
        </div>

        <div style={{ height: 10 }} />

        {/* 選項 */}
        <div style={{ display: "grid", gap: 10 }}>
          {(q?.choices ?? []).map((c) => {
            const picked = pickedChoice === c;
            return (
              <button
                key={c}
                onClick={() => pick(c)}
                disabled={session.paused || isFinished || judging || isWrong}
                style={{
                  ...btn,
                  textAlign: "left",
                  padding: "12px 12px",
                  border: picked ? "1px solid #111" : "1px solid #ddd",
                  background: picked ? "#f5f5f5" : "#fff",
                  opacity: session.paused || isFinished || judging || isWrong ? 0.6 : 1,
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div style={{ height: 10 }} />

        {/* 操作按钮：確定 /（答錯才出現）下一題 */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={{
              ...btnPrimary,
              opacity: session.paused || isFinished || judging || isWrong || !pickedChoice ? 0.5 : 1,
              cursor:
                session.paused || isFinished || judging || isWrong || !pickedChoice ? "not-allowed" : "pointer",
            }}
            onClick={confirm}
            disabled={session.paused || isFinished || judging || isWrong || !pickedChoice}
          >
            確定
          </button>

          {/* ✅ 只有答錯才需要手動下一題 */}
          {isWrong ? (
            <button style={btn} onClick={nextManual} disabled={session.paused || isFinished}>
              下一題 →
            </button>
          ) : null}

          {/* ✅ 塗鴉牆（你要的位置：題目區右側/這一排） */}
          <button style={btn} onClick={() => setWhiteboardOpen(true)} disabled={session.paused}>
            📝 塗鴉牆
          </button>
        </div>

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區：只顯示提示內容（按鈕已放在題目區）===== */}
      {/* ===== 提示區：顯示提示 + 次數 + 對/錯（回到 v2-9 的位置）===== */}
<div style={card}>
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
    {/* 左側：顯示提示 + 次數 + 對/錯 */}
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

      <span style={pill}>對 {session.correctCount ?? 0}</span>
      <span style={pill}>錯 {session.wrongCount ?? 0}</span>
    </div>

    {/* 右側：塗鴉牆 */}
    <button style={btn} onClick={() => setWhiteboardOpen(true)} disabled={session.paused}>
      📝 塗鴉牆
    </button>
  </div>

  <div
    style={{
      padding: 12,
      borderRadius: 12,
      border: "1px dashed #e0e0e0",
      opacity: hintText ? 1 : 0.7,
      lineHeight: 1.8,
      whiteSpace: "pre-wrap",
    }}
  >
    {hintText ? hintText : "尚未使用提示"}
  </div>
</div>

      {/* ✅ Whiteboard 本體 */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}