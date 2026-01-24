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

/* ================= 基本參數 ================= */
const TOTAL_QUESTIONS = 20;
const AUTO_NEXT_DELAY_MS = 2000;

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
  lineHeight: 1.2,
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

function safeStageLabel(session: PracticeSession) {
  return (session as any).stage ?? "-";
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // 提示 / 白板
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // 訊息
  const [msg, setMsg] = useState<string | null>(null);

  // 作答流程（v2-9）
  const [picked, setPicked] = useState<"correct" | "wrong" | null>(null);
  const [locked, setLocked] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [roundDone, setRoundDone] = useState(false);

  const timerRef = useRef<number | null>(null);
  const autoNextRef = useRef<number | null>(null);

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

    // 初始化 UI 狀態
    setHintText(null);
    setMsg(null);
    setPicked(null);
    setLocked(false);
    setIsFinishing(false);
    setRoundDone(false);

    // 清掉可能殘留的 timeout
    if (autoNextRef.current) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }
  }, [router, sp]);

  /* ================= 計時（僅未暫停且未完成時） ================= */
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (roundDone) return;
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
  }, [session?.id, session?.paused, roundDone]);

  /* ================= 派生狀態 ================= */
  const canHint = useMemo(() => {
    if (!session) return false;
    if (roundDone) return false;
    if (session.paused) return false;
    return session.hintUsed < session.hintLimit;
  }, [session, roundDone]);

  const currentQNo = useMemo(() => {
    if (!session) return 1;
    return Number(session.currentIndex ?? 0) + 1;
  }, [session]);

  const isLastQuestion = useMemo(() => currentQNo >= TOTAL_QUESTIONS, [currentQNo]);

  const canPick = !!session && !roundDone && !session.paused && !locked && !isFinishing;
  const canConfirm = !!session && !roundDone && !session.paused && !locked && !isFinishing && !!picked;

  /* ================= 操作 ================= */
  function backToPractice() {
    router.replace("/practice");
  }

  function cleanupAutoNext() {
    if (autoNextRef.current) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }
  }

  function togglePause() {
    if (!session) return;
    if (roundDone) return;

    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);

    // 暫停時取消延遲跳題
    if (next.paused) {
      cleanupAutoNext();
      setIsFinishing(false);
    }
  }

  function onHint() {
    if (!session) return;
    if (!canHint) return;

    const next = { ...session, hintUsed: session.hintUsed + 1 };
    寫入進度(next);
    setSession(next);

    setHintText("提示：先找關鍵字，再判斷/計算，最後回到題目檢查一次。");
  }

  function confirmAnswer() {
    if (!session) return;
    if (!canConfirm) return;

    setLocked(true);
    setIsFinishing(true);

    const isCorrect = picked === "correct";
    const nextAfterJudge: PracticeSession = {
      ...session,
      correctCount: session.correctCount + (isCorrect ? 1 : 0),
      wrongCount: session.wrongCount + (isCorrect ? 0 : 1),
    };

    寫入進度(nextAfterJudge);
    setSession(nextAfterJudge);

    setMsg(isCorrect ? "✅ 判定：答對（2 秒後自動下一題）" : "❌ 判定：答錯（2 秒後自動下一題）");

    cleanupAutoNext();
    autoNextRef.current = window.setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;
        if (prev.paused) {
          setIsFinishing(false);
          return prev;
        }

        const nextIndex = Number(prev.currentIndex ?? 0) + 1;

        // 做完 20 題 → 完成畫面（並自動暫停）
        if (nextIndex >= TOTAL_QUESTIONS) {
          const doneSession: PracticeSession = { ...prev, paused: true };
          寫入進度(doneSession);
          setRoundDone(true);
          setMsg(null);
          setHintText(null);
          setPicked(null);
          setLocked(true);
          setIsFinishing(false);
          return doneSession;
        }

        // 下一題
        const advanced: PracticeSession = { ...prev, currentIndex: nextIndex };
        寫入進度(advanced);

        setPicked(null);
        setLocked(false);
        setIsFinishing(false);
        setMsg(null);
        setHintText(null);

        return advanced;
      });
    }, AUTO_NEXT_DELAY_MS);
  }

  /* ================= 卸載清理 ================= */
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (autoNextRef.current) window.clearTimeout(autoNextRef.current);
      timerRef.current = null;
      autoNextRef.current = null;
    };
  }, []);

  /* ================= 空狀態 ================= */
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

  /* ================= 回合完成畫面 ================= */
  if (roundDone) {
    return (
      <main style={wrap}>
        {/* 這裡一樣放一顆靠右的回學習區，避免找不到出口 */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 2px 8px 2px" }}>
          <button style={btn} onClick={backToPractice}>
            ← 回學習區
          </button>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 22 }}>🎉 本回合完成</div>

          <div style={{ height: 10 }} />

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ opacity: 0.85, lineHeight: 1.9 }}>
              <span style={pill}>科目：{session.subject}</span>{" "}
              <span style={pill}>階段：{safeStageLabel(session)}</span>{" "}
              <span style={pill}>題數：{TOTAL_QUESTIONS}/{TOTAL_QUESTIONS}</span>{" "}
              <span style={pill}>用時：{格式化時間(session.elapsedSec)}</span>
            </div>

            <div style={{ opacity: 0.9, lineHeight: 1.9 }}>
              <span style={pill}>答對：{session.correctCount}</span>{" "}
              <span style={pill}>答錯：{session.wrongCount}</span>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btnPrimary} onClick={backToPractice}>
              回學習區
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ================= UI（v2-9 版面調整） ================= */
  return (
    <main style={wrap}>
      {/* ✅ 回上一頁：放最頂端靠右（貼近你說的「關於旁邊」位置） */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 2px 8px 2px" }}>
        <button style={btn} onClick={backToPractice}>
          ← 回上一頁
        </button>
      </div>

      {/* ===== 狀態卡片：右上放計時+暫停 ===== */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            gap: 8,
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* 左：科目/階段/題號 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{safeStageLabel(session)}</span>
            <span style={pill}>第 {Math.min(currentQNo, TOTAL_QUESTIONS)} 題</span>
          </div>

          {/* 右：計時 / 暫停（放你指定的右上） */}
          <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", alignItems: "center" }}>
            <span style={pill}>⏱ {格式化時間(session.elapsedSec)}</span>
            <button
              onClick={togglePause}
              style={{
                ...pill,
                cursor: "pointer",
                background: "#fff",
                userSelect: "none",
              }}
            >
              {session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區 ===== */}
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
          {hintText ? (
            <div style={{ lineHeight: 1.8 }}>{hintText}</div>
          ) : (
            <div style={{ opacity: 0.7, lineHeight: 1.8 }}>尚未使用提示</div>
          )}
        </div>

        {session.paused ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff8e6" }}>
            已暫停；請按「繼續」後再作答。
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 作答區（v2-9）===== */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
            gap: 10,
            flexWrap: "wrap",
          }}
        >
          <div style={{ fontWeight: 900 }}>作答區（demo）</div>

          <div style={{ display: "flex", gap: 8 }}>
            <span style={pill}>對：{session.correctCount}</span>
            <span style={pill}>錯：{session.wrongCount}</span>
          </div>
        </div>

        <div style={{ opacity: 0.75, lineHeight: 1.8 }}>
          目前為示範模式：先選「答對/答錯」，再按「確定」，系統判定後延遲 2 秒自動下一題。
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={{
              ...btn,
              border: picked === "correct" ? "1px solid #111" : btn.border,
              background: picked === "correct" ? "#111" : "#fff",
              color: picked === "correct" ? "#fff" : "#111",
              opacity: canPick ? 1 : 0.5,
              cursor: canPick ? "pointer" : "not-allowed",
            }}
            disabled={!canPick}
            onClick={() => {
              if (!canPick) return;
              setPicked("correct");
              setMsg(null);
            }}
          >
            選擇：答對
          </button>

          <button
            style={{
              ...btn,
              border: picked === "wrong" ? "1px solid #111" : btn.border,
              background: picked === "wrong" ? "#111" : "#fff",
              color: picked === "wrong" ? "#fff" : "#111",
              opacity: canPick ? 1 : 0.5,
              cursor: canPick ? "pointer" : "not-allowed",
            }}
            disabled={!canPick}
            onClick={() => {
              if (!canPick) return;
              setPicked("wrong");
              setMsg(null);
            }}
          >
            選擇：答錯
          </button>

          <button
            style={{
              ...btnPrimary,
              opacity: canConfirm ? 1 : 0.5,
              cursor: canConfirm ? "pointer" : "not-allowed",
            }}
            disabled={!canConfirm}
            onClick={confirmAnswer}
          >
            確定
          </button>
        </div>

        {msg ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div>
        ) : null}

        {isLastQuestion ? (
          <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
            ⚑ 本題為第 {TOTAL_QUESTIONS} 題（按「確定」後會進入本回合完成畫面）
          </div>
        ) : null}
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}