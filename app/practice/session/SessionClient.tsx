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

/* ================= 基本樣式 ================= */
const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "8px 0" };

const card: React.CSSProperties = {
  padding: "14px 14px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };

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

function pickSubjectLabel(s: Subject) {
  return s;
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // ✅ Step 3 核心：本題作答鎖定（只存在前端 UI，下一題會重置）
  const [answered, setAnswered] = useState(false);

  const timerRef = useRef<number | null>(null);

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
    setHintText(null);
    setMsg(null);

    // ✅ 讀入一筆進度時，把本題鎖定重置（避免跨頁殘留）
    setAnswered(false);
  }, [router, sp]);

  /* ================= 計時（非暫停才跑） ================= */
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;

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
      if (timerRef.current) window.clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [session?.id, session?.paused]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return session.hintUsed < session.hintLimit;
  }, [session]);

  const isPaused = !!session?.paused;

  /* ================= 操作函式 ================= */
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

    setHintText("提示：先把題目拆成兩步，先找關鍵字，再計算/判斷。");
  }

  function clearThis() {
    if (!session) return;
    刪除進度(session.id);
    setMsg(`已清除此回合：${pickSubjectLabel(session.subject)}`);
    router.replace("/practice");
  }

  function backToPractice() {
    router.replace("/practice");
  }

  function ensureSessionOrCreate(subject: Subject) {
    const s = 新增進度(subject);
    寫入進度(s);
    設定目前進度id(s.id);
    router.replace(`/practice/session?id=${encodeURIComponent(s.id)}`);
  }

  // ✅ Step 3：提交作答（一次性）
  function submit(isCorrect: boolean) {
    if (!session) return;
    if (isPaused) return;

    // 已作答就不允許重複按（避免一直加）
    if (answered) return;

    const next = { ...session };
    if (isCorrect) {
      (next as any).correctCount = ((next as any).correctCount ?? 0) + 1;
      setMsg("答對了！請繼續下一題。");
    } else {
      (next as any).wrongCount = ((next as any).wrongCount ?? 0) + 1;
      setMsg("很可惜沒有答對，請再試一次。");
    }

    寫入進度(next);
    setSession(next);

    // ✅ 鎖定本題
    setAnswered(true);
  }

  // ✅ Step 3：下一題（必須先作答，且暫停不能前進）
  function nextQuestion() {
    if (!session) return;
    if (isPaused) return;

    // 未作答不能前進
    if (!answered) {
      setMsg("本題尚未作答，請先作答。");
      return;
    }

    const next = { ...session, currentIndex: session.currentIndex + 1 };
    寫入進度(next);
    setSession(next);

    // ✅ 進入下一題，解除鎖定
    setAnswered(false);
    setHintText(null);
    setMsg(null);
  }

  /* ================= 空狀態 ================= */
  if (!session) {
    return (
      <main style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>讀取中…</div>
          <div style={{ opacity: 0.7, fontSize: 13 }}>若一直停在這裡，請回到 /practice 重新進入。</div>
        </div>

        <div style={{ height: 10 }} />

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>快速建立測試進度（可忽略）</div>
          <div style={row}>
            <button style={btnPrimary} onClick={() => ensureSessionOrCreate("英文")}>
              建立 英文
            </button>
            <button style={btnPrimary} onClick={() => ensureSessionOrCreate("數學")}>
              建立 數學
            </button>
            <button style={btnPrimary} onClick={() => ensureSessionOrCreate("其他")}>
              建立 其他
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* ================= UI ================= */
  return (
    <main style={wrap}>
      {/* ===== 頂部狀態（瘦身版）===== */}
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
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{(session as any).stage ?? "-"}</span>
            <span style={pill}>第 {session.currentIndex + 1} 題</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>⏱ {格式化時間(session.elapsedSec)}</span>

            <button onClick={togglePause} style={btn}>
              {session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>

            <button style={btn} onClick={backToPractice}>
              ← 回上一頁
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={pill}>
            提示：{session.hintUsed}/{session.hintLimit}
          </span>

          {/* ✅ 顯示本題狀態（方便你測試） */}
          <span style={pill}>本題：{answered ?記 `已作答` : "未作答"}</span>
        </div>

        {session.paused ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#fff8e6" }}>
            已暫停；按「繼續」後再作答。
          </div>
        ) : null}
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>提示</div>

        <div style={row}>
          <button
            onClick={onHint}
            disabled={!canHint || isPaused}
            style={{ ...btn, opacity: !canHint || isPaused ? 0.5 : 1 }}
          >
            顯示提示
          </button>

          <button style={btn} onClick={() => setWhiteboardOpen(true)}>
            📝 涂鴉牆
          </button>
        </div>

        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, border: "1px dashed #e0e0e0" }}>
          {hintText ? (
            <div style={{ lineHeight: 1.8 }}>{hintText}</div>
          ) : (
            <div style={{ opacity: 0.7, lineHeight: 1.8 }}>點「顯示提示」後會顯示提示內容（答對前會停留）。</div>
          )}
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 作答區（v2 demo）===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>作答區（v2 範例）</div>
        <div style={{ opacity: 0.7, lineHeight: 1.8 }}>
          v2 先把「流程」鎖定：每題只能作答一次 → 作答後才能下一題。題型系統（選擇/填空/應用）會在 v3 補上。
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={{ ...btnPrimary, opacity: isPaused || answered ? 0.5 : 1 }}
            onClick={() => submit(true)}
            disabled={isPaused || answered}
          >
            模擬答對
          </button>

          <button
            style={{ ...btn, opacity: isPaused || answered ? 0.5 : 1 }}
            onClick={() => submit(false)}
            disabled={isPaused || answered}
          >
            模擬答錯
          </button>

          <button style={{ ...btn, opacity: isPaused ? 0.5 : 1 }} onClick={nextQuestion} disabled={isPaused}>
            下一題 →
          </button>

          {/* 你說 v2 之後要移除「清除此回合」：先保留在這裡（後續 v2-8-3 再拿掉） */}
          <button style={btn} onClick={clearThis}>
            清除此回合
          </button>
        </div>

        {msg ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div>
        ) : null}
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}