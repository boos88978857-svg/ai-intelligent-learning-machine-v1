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

// ✅ 浮動「回上一頁」：固定在右上角（你圈的那個位置）
const backFloatingBtn: React.CSSProperties = {
  position: "fixed",
  top: 10, // 你要再更贴近顶栏，可改成 6 或 8
  right: 10,
  zIndex: 9999,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
};

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // 提示/涂鴉牆
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // 訊息
  const [msg, setMsg] = useState<string | null>(null);

  // v2-9：先選答案 -> 再確定 -> 2 秒後自動下一題
  const [picked, setPicked] = useState<"correct" | "wrong" | null>(null);
  const [isResolving, setIsResolving] = useState(false);

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

    // 重置 UI 狀態
    setPicked(null);
    setIsResolving(false);
    setMsg(null);
    setHintText(null);

    if (autoNextRef.current) window.clearTimeout(autoNextRef.current);
    autoNextRef.current = null;
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

  /* ================= 提示 ================= */
  const canHint = useMemo(() => {
    if (!session) return false;
    return session.hintUsed < session.hintLimit;
  }, [session]);

  function onHint() {
    if (!session) return;

    if (!canHint) {
      setHintText("提示次數已用完");
      return;
    }

    const next = { ...session, hintUsed: session.hintUsed + 1 };
    寫入進度(next);
    setSession(next);

    // demo 提示
    setHintText("提示：先把題目拆成兩步，先找關鍵字，再計算/判斷。");
  }

  /* ================= 行為/按鈕 ================= */
  function backToPractice() {
    router.replace("/practice");
  }

  function togglePause() {
    if (!session) return;

    // 暫停時：停止自動下一題倒數
    if (autoNextRef.current) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }
    setIsResolving(false);

    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);

    setMsg(null);
  }

  const canPick = !!session && !session.paused && !isResolving;
  const canConfirm = !!session && !session.paused && !!picked && !isResolving;

  function confirmAnswer() {
    if (!session) return;
    if (!canConfirm) return;

    setIsResolving(true);

    // 先判定對/錯並寫入
    let next: PracticeSession = session;
    if (picked === "correct") {
      next = { ...session, correctCount: session.correctCount + 1 };
      setMsg("✅ 判定：答對！2 秒後進入下一題…");
    } else {
      next = { ...session, wrongCount: session.wrongCount + 1 };
      setMsg("❌ 判定：答錯！2 秒後進入下一題…");
    }

    寫入進度(next);
    setSession(next);

    // 2 秒後自動下一題
    if (autoNextRef.current) window.clearTimeout(autoNextRef.current);
    autoNextRef.current = window.setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;
        const moved = { ...prev, currentIndex: prev.currentIndex + 1 };
        寫入進度(moved);
        return moved;
      });

      setPicked(null);
      setIsResolving(false);
      setMsg(null);
      setHintText(null);

      autoNextRef.current = null;
    }, 2000);
  }

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

  /* ================= UI ================= */
  return (
    <main style={wrap}>
      {/* ✅ 回上一頁：固定到你圈的最上面那排右侧 */}
      <button style={backFloatingBtn} onClick={backToPractice}>
        ← 回上一頁
      </button>

      {/* ===== 頂部狀態（v2-9）===== */}
      <div style={card}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div style={row}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>第 {session.currentIndex + 1} 題</span>
          </div>

          {/* 右側：計時 + 暫停 */}
          <div style={row}>
            <span style={pill}>⏱ {格式化時間(session.elapsedSec)}</span>

            <button
              onClick={togglePause}
              style={{
                ...pill,
                cursor: "pointer",
                background: "#fff",
                opacity: isResolving ? 0.6 : 1,
              }}
              disabled={isResolving}
            >
              {session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>
          </div>
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區（提示次數放在標題旁）===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <span>提示</span>
          <span style={pill}>
            {session.hintUsed}/{session.hintLimit}
          </span>
        </div>

        <div style={row}>
          <button
            style={{ ...btn, opacity: canHint && !session.paused ? 1 : 0.5 }}
            onClick={onHint}
            disabled={!canHint || session.paused}
          >
            顯示提示
          </button>

          <button style={{ ...btn, opacity: session.paused ? 0.5 : 1 }} onClick={() => setWhiteboardOpen(true)} disabled={session.paused}>
            📝 塗鴉牆
          </button>
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
          {hintText || "點「顯示提示」後會顯示提示內容（判定前會停留）。"}
        </div>

        {session.paused ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff8e6" }}>
            已暫停；請按「繼續」後再作答。
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 作答區（v2-9：選答案 -> 確定 -> 2 秒自動下一題）===== */}
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900 }}>作答區（demo）</div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={pill}>對：{session.correctCount}</span>
            <span style={pill}>錯：{session.wrongCount}</span>
          </div>
        </div>

        <div style={{ opacity: 0.7, marginBottom: 10, lineHeight: 1.7 }}>
          目前為示範模式：先選「答對/答錯」，再按「確定」，系統判定後延遲 2 秒自動下一題。
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={{
              ...btnPrimary,
              opacity: canPick ? 1 : 0.5,
              background: picked === "correct" ? "#111" : "#fff",
              color: picked === "correct" ? "#fff" : "#111",
              border: picked === "correct" ? "1px solid #111" : "1px solid #ddd",
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
              opacity: canPick ? 1 : 0.5,
              background: picked === "wrong" ? "#111" : "#fff",
              color: picked === "wrong" ? "#fff" : "#111",
              border: picked === "wrong" ? "1px solid #111" : "1px solid #ddd",
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
            style={{ ...btnPrimary, opacity: canConfirm ? 1 : 0.4 }}
            disabled={!canConfirm}
            onClick={confirmAnswer}
          >
            確定
          </button>

          {isResolving ? <span style={pill}>判定中…</span> : null}
        </div>

        {msg ? (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div>
        ) : null}
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}