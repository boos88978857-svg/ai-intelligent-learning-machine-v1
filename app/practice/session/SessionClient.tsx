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
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 13,
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

    // v1/v2 demo：固定提示（後續換成題庫/AI 提示）
    setHintText("提示：先把題目拆成兩步，先找關鍵字，再計算/判斷。");
  }

  function clearThis() {
    if (!session) return;
    刪除進度(session.id);
    setMsg(`已清除此回合：${pickSubjectLabel(session.subject)}`);
    router.replace("/practice");
  }

  function backToPractice() {
    // ✅ 重要：不要帶 subject/stage 參數，避免觸發自動建進度造成「閃跳」
    router.replace("/practice");
  }

  function ensureSessionOrCreate(subject: Subject) {
    // 測試用：快速建立進度（可忽略）
    const s = 新增進度(subject);
    寫入進度(s);
    設定目前進度id(s.id);
    router.replace(`/practice/session?id=${encodeURIComponent(s.id)}`);
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
      {/* ===== 頂部狀態（v2-8-1 瘦身版）===== */}
      <div style={card}>
        {/* 上排：科目/階段/題號（盡量同一行） */}
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

          {/* 右側：時間 + 暫停 + 回上一頁 */}
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

        {/* 下排：提示（把 0/3 放到「提示」旁邊） */}
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span style={pill}>
            提示：{session.hintUsed}/{session.hintLimit}
          </span>
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
          <button onClick={onHint} disabled={!canHint} style={{ ...btn, opacity: canHint ? 1 : 0.5 }}>
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

      {/* ===== 作答區（v1/v2 demo）===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>作答區（v1/v2 範例）</div>
        <div style={{ opacity: 0.7, lineHeight: 1.8 }}>
          這裡是最小可跑版本。後續你要的「選擇題/填空/應用題」會在 v3 題型系統逐步補上。
        </div>

        {/* ✅ v2-8-2 會把「對/錯」移到這裡並做更省空間的樣式 */}
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={btnPrimary}
            onClick={() => {
              const next = { ...session, correctCount: session.correctCount + 1 };
              寫入進度(next);
              setSession(next);
              setMsg("答對了！請繼續下一題。");
            }}
          >
            模擬答對
          </button>

          <button
            style={btn}
            onClick={() => {
              const next = { ...session, wrongCount: session.wrongCount + 1 };
              寫入進度(next);
              setSession(next);
              setMsg("很可惜沒有答對，請再試一次。");
            }}
          >
            模擬答錯
          </button>

          <button
            style={btn}
            onClick={() => {
              const next = { ...session, currentIndex: session.currentIndex + 1 };
              寫入進度(next);
              setSession(next);
              setMsg("已前進下一題");
            }}
          >
            下一題 →
          </button>

          <button style={btn} onClick={clearThis}>
            清除此回合
          </button>
        </div>

        {msg ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>{msg}</div>
        ) : null}
      </div>

      {/* ✅ Whiteboard 本體：必須在 </main> 之前 */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}