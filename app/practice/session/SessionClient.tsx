"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/* ================= 基础样式 ================= */

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "8px 0",
};

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

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

/* ================= SessionClient ================= */

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const id = sp.get("id");

  const timerRef = useRef<any>(null);

  const [session, setSession] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);

  /* ===== 工具：动态载入 session lib ===== */
  async function withSessionLib<T>(fn: (m: any) => T | Promise<T>) {
    const m = await import("../../../lib/session");
    return fn(m);
  }

  function formatTime(sec = 0) {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = Math.floor(sec % 60)
      .toString()
      .padStart(2, "0");
    return `${m}:${s}`;
  }

  /* ===== 读取 session ===== */
  useEffect(() => {
    if (!id) {
      router.replace("/practice");
      return;
    }

    (async () => {
      const s = await withSessionLib((m) => {
        const fn =
          m.getSession ||
          m.讀取進度 ||
          m.readSession ||
          m.getCurrentSession;
        return fn ? fn(id) : null;
      });

      if (!s) {
        router.replace("/practice");
        return;
      }

      setSession(s);
      setQuestions(s.questions || []);
    })();
  }, [id, router]);

  /* ===== 计时 ===== */
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (session.paused) return;

    timerRef.current = window.setInterval(() => {
      setSession((prev: any) => {
        if (!prev) return prev;
        const next = { ...prev, elapsedSec: (prev.elapsedSec ?? 0) + 1 };
        withSessionLib((m) => {
          const write = m.寫入進度 || m.saveSession || m.writeSession;
          if (write) write(next);
        });
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

  const currentQuestion = useMemo(() => {
    if (!session) return null;
    return questions[session.currentIndex] ?? null;
  }, [questions, session?.currentIndex]);

  const canHint = useMemo(() => {
    if (!session) return false;
    return session.hintUsed < session.hintLimit;
  }, [session]);

  /* ===== 操作 ===== */

  function togglePause() {
    if (!session) return;
    const next = { ...session, paused: !session.paused };
    withSessionLib((m) => {
      const write = m.寫入進度 || m.saveSession || m.writeSession;
      if (write) write(next);
    });
    setSession(next);
  }

  function onHint() {
    if (!session) return;
    if (!canHint) {
      setHintText("提示次數已用完");
      return;
    }
    const next = { ...session, hintUsed: session.hintUsed + 1 };
    withSessionLib((m) => {
      const write = m.寫入進度 || m.saveSession || m.writeSession;
      if (write) write(next);
    });
    setSession(next);
    setHintText(currentQuestion?.hint ?? "（本题暂无提示）");
  }

  function backToPractice() {
  router.replace("/practice");
}

  /* ===== 尚未载入 ===== */
  if (!session) {
    return (
      <main style={wrap}>
        <div style={card}>載入中…</div>
      </main>
    );
  }

  /* ================= UI ================= */

  return (
    <main style={wrap}>
      {/* ===== 顶部状态 ===== */}
      <div style={card}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div style={row}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{session.stage ?? "-"}</span>
            <span style={pill}>第 {session.currentIndex + 1} 題</span>
            <span style={pill}>⏱ {formatTime(session.elapsedSec)}</span>
            <span style={pill}>
              對：{session.correctCount} / 錯：{session.wrongCount}
            </span>
            <span style={pill}>
              提示：{session.hintUsed}/{session.hintLimit}
            </span>
          </div>

          <div style={row}>
            <button style={btn} onClick={togglePause}>
              {session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>
            <button style={btn} onClick={backToPractice}>
              ← 回上一頁
            </button>
          </div>
        </div>

        {session.paused && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 12,
              background: "#fff8e6",
            }}
          >
            已暫停；按「繼續」後再作答。
          </div>
        )}
      </div>

      <div style={{ height: 12 }} />

      {/* ===== 提示区 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>提示</div>
        <div style={row}>
          <button style={btn} onClick={onHint} disabled={!canHint}>
            顯示提示
          </button>
        </div>

        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            border: "1px dashed #ddd",
            opacity: hintText ? 1 : 0.7,
          }}
        >
          {hintText ?? "點「顯示提示」後會顯示提示內容（答對前會保留）。"}
        </div>
      </div>

      <div style={{ height: 12 }} />

      {/* ===== 作答区 ===== */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>作答區</div>

        <div style={{ lineHeight: 1.8, marginBottom: 12 }}>
          {currentQuestion?.text ?? "（暫無題目）"}
        </div>

        <div style={row}>
          <input
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="請輸入答案（暫不判斷）"
            style={{
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              flex: 1,
            }}
          />
          <button style={btnPrimary}>送出</button>
          <button style={btn} onClick={() => setAnswer("")}>
            清除
          </button>
        </div>

        {msg && (
          <div style={{ marginTop: 12, opacity: 0.8 }}>{msg}</div>
        )}
      </div>
    </main>
  );
}