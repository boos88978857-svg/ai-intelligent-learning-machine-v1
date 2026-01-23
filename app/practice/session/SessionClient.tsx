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

const pillBtn: React.CSSProperties = {
  ...pill,
  cursor: "pointer",
  background: "#fff",
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

type SessionAny = PracticeSession & { lastAnsweredIndex?: number; stage?: string };

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<SessionAny | null>(null);

  // UI
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

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

    const s0 = 讀取進度(id) as SessionAny | null;
    if (!s0) {
      router.replace("/practice");
      return;
    }

    // ✅ 確保有 lastAnsweredIndex（持久化判斷作答用）
    const s: SessionAny = {
      ...s0,
      lastAnsweredIndex: typeof s0.lastAnsweredIndex === "number" ? s0.lastAnsweredIndex : -1,
    };

    // 可選：寫回去，避免之後又缺欄位
    寫入進度(s);

    setSession(s);
    setHintText(null);
    setMsg(null);
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
        const next: SessionAny = { ...prev, elapsedSec: prev.elapsedSec + 1 };
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

  const actionLocked = !!session?.paused;

  // ✅ 核心規則：只有「本題已作答」才允許下一題
  const answeredThisQuestion = useMemo(() => {
    if (!session) return false;
    return (session.lastAnsweredIndex ?? -1) === session.currentIndex;
  }, [session]);

  const canGoNext = !actionLocked && answeredThisQuestion;

  /* ================= 操作函式 ================= */
  function togglePause() {
    if (!session) return;
    const next: SessionAny = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);
  }

  function onHint() {
    if (!session) return;

    if (!canHint) {
      setHintText("提示次數已用完");
      return;
    }

    const next: SessionAny = { ...session, hintUsed: session.hintUsed + 1 };
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
    const s = 新增進度(subject) as SessionAny;
    const next: SessionAny = { ...s, lastAnsweredIndex: -1 };
    寫入進度(next);
    設定目前進度id(next.id);
    router.replace(`/practice/session?id=${encodeURIComponent(next.id)}`);
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
      {/* ===== 頂部狀態 ===== */}
      <div style={card}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{session.stage ?? "-"}</span>
            <span style={pill}>第 {session.currentIndex + 1} 題</span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "nowrap", alignItems: "center" }}>
            <button onClick={togglePause} style={pillBtn}>
              ⏱ {格式化時間(session.elapsedSec)}　|　{session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>

            <button style={{ ...btn, whiteSpace: "nowrap" }} onClick={backToPractice}>
              ← 回上一頁
            </button>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={pill}>
            提示：{session.hintUsed}/{session.hintLimit}
          </span>
          {actionLocked ? <span style={pill}>已暫停：作答/下一題已鎖定</span> : null}
          {!actionLocked && !answeredThisQuestion ? <span style={pill}>本題未作答：請先答對/答錯一次</span> : null}
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* ===== 提示區 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>提示</div>

        <div style={row}>
          <button onClick={onHint} disabled={!canHint || actionLocked} style={{ ...btn, opacity: !canHint || actionLocked ? 0.5 : 1 }}>
            顯示提示
          </button>

          <button style={{ ...btn, opacity: actionLocked ? 0.5 : 1 }} disabled={actionLocked} onClick={() => setWhiteboardOpen(true)}>
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

      {/* ===== 作答區（v1/v2 demo）===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>作答區（v1/v2 範例）</div>
        <div style={{ opacity: 0.7, lineHeight: 1.8 }}>
          這裡是最小可跑版本。後續你要的「選擇題/填空/應用題」會在 v3 題型系統逐步補上。
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginLeft: "auto" }}>
            <span style={pill}>對：{session.correctCount ?? 0}</span>
            <span style={pill}>錯：{session.wrongCount ?? 0}</span>
          </div>
        </div>

        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={{ ...btnPrimary, opacity: actionLocked ? 0.5 : 1 }}
            disabled={actionLocked}
            onClick={() => {
              if (actionLocked) return;
              const next: SessionAny = {
                ...session,
                correctCount: (session.correctCount ?? 0) + 1,
                lastAnsweredIndex: session.currentIndex, // ✅ 記錄本題已作答
              };
              寫入進度(next);
              setSession(next);
              setMsg("已記錄：答對。現在可以點「下一題」。");
            }}
          >
            模擬答對
          </button>

          <button
            style={{ ...btn, opacity: actionLocked ? 0.5 : 1 }}
            disabled={actionLocked}
            onClick={() => {
              if (actionLocked) return;
              const next: SessionAny = {
                ...session,
                wrongCount: (session.wrongCount ?? 0) + 1,
                lastAnsweredIndex: session.currentIndex, // ✅ 記錄本題已作答
              };
              寫入進度(next);
              setSession(next);
              setMsg("已記錄：答錯。現在可以點「下一題」。");
            }}
          >
            模擬答錯
          </button>

          <button
            style={{ ...btn, opacity: canGoNext ? 1 : 0.5 }}
            disabled={!canGoNext}
            onClick={() => {
              // ✅ 雙重保險
              if (actionLocked) {
                setMsg("目前已暫停，請先按「繼續」再前進下一題。");
                return;
              }
              if ((session.lastAnsweredIndex ?? -1) !== session.currentIndex) {
                setMsg("本題尚未作答，請先「模擬答對 / 模擬答錯」再前進。");
                return;
              }

              const next: SessionAny = {
                ...session,
                currentIndex: session.currentIndex + 1,
                // ✅ 注意：不要改 lastAnsweredIndex，讓下一題立刻鎖住
              };
              寫入進度(next);
              setSession(next);
              setMsg("已前進下一題");
            }}
          >
            下一題 →
          </button>

          <button
            style={{ ...btn, opacity: actionLocked ? 0.5 : 1 }}
            disabled={actionLocked}
            onClick={() => {
              if (actionLocked) return;
              clearThis();
            }}
          >
            清除此回合
          </button>
        </div>

        {msg ? <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div> : null}
      </div>

      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}