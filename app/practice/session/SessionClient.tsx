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
  新增進度,
  格式化時間,
  type PracticeSession,
  type Subject,
} from "../../../lib/session";

/* ================= 基本設定 ================= */
const QUESTIONS_PER_ROUND = 20;

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

const btnDisabled: React.CSSProperties = {
  ...btn,
  opacity: 0.45,
  cursor: "not-allowed",
};

/** ✅ 让「回上一页」固定到最上面右侧（靠近“关于”那排） */
const floatingBack: React.CSSProperties = {
  position: "fixed",
  top: 72, // 这个高度适合你现在的顶栏（如果你顶栏更高/更低，可改 64~88 之间）
  right: 12,
  zIndex: 9999,
};

function pickSubjectLabel(s: Subject) {
  return s;
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // 提示/白板
  const [hintText, setHintText] = useState<string>("尚未使用提示");
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // v2-9：作答流程（先选择 -> 确定 -> 2 秒后下一题）
  const [selected, setSelected] = useState<"correct" | "wrong" | null>(null);
  const [judging, setJudging] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // 计时/延迟跳题
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

    // 进入题目时：清掉选择/讯息/判定状态
    setSelected(null);
    setJudging(false);
    setMsg(null);
    setHintText("尚未使用提示");
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

  /* ================= 清理延迟任务（避免跳题残留） ================= */
  useEffect(() => {
    return () => {
      if (autoNextRef.current) {
        window.clearTimeout(autoNextRef.current);
        autoNextRef.current = null;
      }
    };
  }, []);

  /* ================= 狀態衍生 ================= */
  const isFinished = useMemo(() => {
    if (!session) return false;
    return (session.currentIndex ?? 0) >= QUESTIONS_PER_ROUND;
  }, [session]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return session.hintUsed < session.hintLimit;
  }, [session]);

  const canSelect = !!session && !session.paused && !judging && !isFinished;
  const canConfirm = !!session && !session.paused && !judging && !isFinished && !!selected;

  /* ================= 操作 ================= */
  function backToPractice() {
    router.replace("/practice");
  }

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

    // demo 提示
    setHintText("提示：先抓關鍵字，再判斷/計算。");
  }

  function goNextAfter2s(current: PracticeSession) {
    // 2 秒后自动下一题
    if (autoNextRef.current) window.clearTimeout(autoNextRef.current);

    autoNextRef.current = window.setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;

        // 若中途被暂停，不自动前进（你要的话也可以改成照样前进）
        if (prev.paused) return prev;

        const next = { ...prev, currentIndex: (prev.currentIndex ?? 0) + 1 };
        寫入進度(next);
        return next;
      });

      setSelected(null);
      setJudging(false);
      setMsg(null);
      setHintText("尚未使用提示");
      autoNextRef.current = null;
    }, 2000);
  }

  function confirmAnswer() {
    if (!session) return;
    if (!canConfirm) return;

    setJudging(true);

    const next =
      selected === "correct"
        ? { ...session, correctCount: session.correctCount + 1 }
        : { ...session, wrongCount: session.wrongCount + 1 };

    寫入進度(next);
    setSession(next);

    setMsg(selected === "correct" ? "判定：答對 ✅（2 秒後自動下一題）" : "判定：答錯 ❌（2 秒後自動下一題）");

    goNextAfter2s(next);
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

  /* ================= 完成頁（20/20） ================= */
  if (isFinished) {
    return (
      <main style={wrap}>
        {/* ✅ 完成頁不要右上角再多一顆回學習區，這裡不渲染 floatingBack */}
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 28, marginBottom: 12 }}>🎉 本回合完成</div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            <span style={pill}>科目：{pickSubjectLabel(session.subject)}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>題數：{QUESTIONS_PER_ROUND}/{QUESTIONS_PER_ROUND}</span>
            <span style={pill}>用時：{格式化時間(session.elapsedSec)}</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 14 }}>
            <span style={pill}>答對：{session.correctCount}</span>
            <span style={pill}>答錯：{session.wrongCount}</span>
          </div>

          <button style={btnPrimary} onClick={backToPractice}>
            回學習區
          </button>
        </div>
      </main>
    );
  }

  /* ================= UI ================= */
  return (
    <main style={wrap}>
      {/* ✅ 固定在最上面右侧：回上一页（靠近“关于”那排） */}
      <div style={floatingBack}>
        <button style={btn} onClick={backToPractice}>
          ← 回上一頁
        </button>
      </div>

      {/* ===== 顶部状态卡：右上角放计时 + 暂停（取代原本回上一页的位置） ===== */}
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>第 {session.currentIndex + 1} 題</span>
          </div>

          {/* 右侧：计时 + 暂停 */}
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

        {session.paused && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#fff8e6" }}>
            已暫停；請按「繼續」後再作答。
          </div>
        )}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區：次數在標題旁 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <span>提示</span>
          <span style={pill}>
            {session.hintUsed}/{session.hintLimit}
          </span>
        </div>

        <div style={row}>
          <button
            style={canHint && !session.paused ? btn : btnDisabled}
            onClick={onHint}
            disabled={!canHint || session.paused}
          >
            顯示提示
          </button>

          <button style={session.paused ? btnDisabled : btn} onClick={() => setWhiteboardOpen(true)} disabled={session.paused}>
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
          {hintText}
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 作答區（v2-9：先選 -> 確定 -> 2 秒自動下一題） ===== */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div style={{ fontWeight: 900 }}>作答區（demo）</div>

          <div style={{ display: "flex", gap: 8 }}>
            <span style={pill}>對：{session.correctCount}</span>
            <span style={pill}>錯：{session.wrongCount}</span>
          </div>
        </div>

        <div style={{ opacity: 0.75, lineHeight: 1.7, marginBottom: 12 }}>
          目前為示範模式：先選「答對/答錯」，再按「確定」，系統判定後延遲 2 秒自動下一題。
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={selected === "correct" ? btnPrimary : btn}
            disabled={!canSelect}
            onClick={() => setSelected("correct")}
          >
            選擇：答對
          </button>

          <button
            style={selected === "wrong" ? btnPrimary : btn}
            disabled={!canSelect}
            onClick={() => setSelected("wrong")}
          >
            選擇：答錯
          </button>

          <button
            style={canConfirm ? btnPrimary : btnDisabled}
            disabled={!canConfirm}
            onClick={confirmAnswer}
          >
            確定
          </button>
        </div>

        {msg && (
          <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>
            {msg}
          </div>
        )}
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}