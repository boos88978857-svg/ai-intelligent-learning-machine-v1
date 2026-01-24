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
  刪除進度,
  新增進度,
  格式化時間,
  type PracticeSession,
  type Subject,
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

const btnGhost: React.CSSProperties = {
  ...btn,
  background: "#fff",
};

function safeStageLabel(session: PracticeSession) {
  return (session as any).stage ?? "-";
}

/* ================= 主體 ================= */
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
  const [picked, setPicked] = useState<"correct" | "wrong" | null>(null); // 使用者選擇
  const [locked, setLocked] = useState(false); // 按下「確定」後鎖住
  const [isFinishing, setIsFinishing] = useState(false); // 正在延遲跳下一題
  const [roundDone, setRoundDone] = useState(false); // 20 題完成

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

    // 清除舊計時器
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

  const isLastQuestion = useMemo(() => {
    return currentQNo >= TOTAL_QUESTIONS;
  }, [currentQNo]);

  const canPick = !!session && !roundDone && !session.paused && !locked && !isFinishing;
  const canConfirm = !!session && !roundDone && !session.paused && !locked && !isFinishing && !!picked;

  /* ================= 操作函式 ================= */
  function backToPractice() {
    router.replace("/practice");
  }

  function togglePause() {
    if (!session) return;
    if (roundDone) return;

    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);

    // 暫停時清掉「延遲自動下一題」
    if (next.paused && autoNextRef.current) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
      setIsFinishing(false);
    }
  }

  function onHint() {
    if (!session) return;
    if (!canHint) return;

    const next = { ...session, hintUsed: session.hintUsed + 1 };
    寫入進度(next);
    setSession(next);

    // demo 提示
    setHintText("提示：先找關鍵字，再判斷/計算，最後回到題目檢查一次。");
  }

  function cleanupAutoNext() {
    if (autoNextRef.current) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }
  }

  function confirmAnswer() {
    if (!session) return;
    if (!canConfirm) return;

    setLocked(true);
    setIsFinishing(true);

    // 更新對/錯
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
      // 若中途暫停或 session 不在了就不動
      setSession((prev) => {
        if (!prev) return prev;
        if (prev.paused) {
          setIsFinishing(false);
          return prev;
        }

        // 如果已經做完 20 題：進入完成畫面
        const nextIndex = Number(prev.currentIndex ?? 0) + 1;
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

        // 否則正常下一題
        const advanced: PracticeSession = { ...prev, currentIndex: nextIndex };
        寫入進度(advanced);

        // 新題：解鎖、清狀態
        setPicked(null);
        setLocked(false);
        setIsFinishing(false);
        setMsg(null);
        setHintText(null);

        return advanced;
      });
    }, AUTO_NEXT_DELAY_MS);
  }

  function resetRoundStateUIOnly() {
    setPicked(null);
    setLocked(false);
    setIsFinishing(false);
    setMsg(null);
    setHintText(null);
  }

  // v2-9：重練錯題（先占位，v3 做題庫後再真正重練）
  function retryWrongPlaceholder() {
    setMsg("重練錯題：v3 題型系統上線後啟用（目前先回到學習區）。");
    window.setTimeout(() => {
      router.replace("/practice");
    }, 800);
  }

  /* ================= 離開 / 卸載時清計時器 ================= */
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

  /* ================= 回合完成畫面（v2-9 Step 2） ================= */
  if (roundDone) {
    return (
      <main style={wrap}>
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 900, fontSize: 22 }}>🎉 本回合完成</div>
            <button style={btn} onClick={backToPractice}>← 回學習區</button>
          </div>

          <div style={{ height: 10 }} />

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ opacity: 0.8, lineHeight: 1.8 }}>
              <span style={pill}>科目：{session.subject}</span>{" "}
              <span style={pill}>階段：{safeStageLabel(session)}</span>{" "}
              <span style={pill}>題數：{TOTAL_QUESTIONS}/{TOTAL_QUESTIONS}</span>{" "}
              <span style={pill}>用時：{格式化時間(session.elapsedSec)}</span>
            </div>

            <div style={{ opacity: 0.9, lineHeight: 1.8 }}>
              <span style={pill}>答對：{session.correctCount}</span>{" "}
              <span style={pill}>答錯：{session.wrongCount}</span>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button style={btnPrimary} onClick={retryWrongPlaceholder}>重練錯題</button>
            <button style={btnGhost} onClick={backToPractice}>回學習區</button>
          </div>

          {msg ? (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div>
          ) : null}
        </div>
      </main>
    );
  }

  /* ================= UI ================= */
  return (
    <main style={wrap}>
      {/* ===== 頂部狀態（v2-9）===== */}
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
          {/* 左側：科目/階段/題號 */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{safeStageLabel(session)}</span>
            <span style={pill}>第 {Math.min(currentQNo, TOTAL_QUESTIONS)} 題</span>
          </div>

          {/* 右側：回上一頁（你已經 OK 的位置） */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <button style={btn} onClick={backToPractice}>← 回上一頁</button>
          </div>
        </div>

        <div style={{ height: 8 }} />

        {/* 第二排：計時 / 暫停（照你目前布局） */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
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

      <div style={{ height: 10 }} />

      {/* ===== 提示區 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <span>提示</span>
          {/* v2-9：提示次數顯示在標題旁 */}
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

      {/* ===== 作答區（v2-9：先選答對/答錯，再按確定，延遲2秒自動下一題）===== */}
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

          {/* 若你要「取消選擇」方便測試，可以保留；不想要就刪掉 */}
          <button
            style={{
              ...btn,
              opacity: !session.paused && !roundDone && !isFinishing ? 1 : 0.5,
              cursor: !session.paused && !roundDone && !isFinishing ? "pointer" : "not-allowed",
            }}
            disabled={session.paused || roundDone || isFinishing}
            onClick={() => {
              if (session.paused || roundDone || isFinishing) return;
              resetRoundStateUIOnly();
            }}
          >
            取消選擇
          </button>
        </div>

        {msg ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div>
        ) : null}

        {/* 最後一題提醒（可留可删） */}
        {isLastQuestion ? (
          <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
            ⚑ 本題為第 {TOTAL_QUESTIONS} 題（按「確定」後會進入本回合完成畫面）
          </div>
        ) : null}
      </div>

      {/* Whiteboard：必須在 </main> 之前 */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}