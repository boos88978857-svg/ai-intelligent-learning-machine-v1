"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  PracticeSession,
  Question,
  Subject,
  formatTime,
  getSession,
  getMockQuestions,
  goNext,
  removeSession,
  setActiveSessionId,
  submitAnswer,
  togglePause,
  upsertSession,
  useHint
} from "../../../lib/session";

// ====== UI 樣式（先用 inline，後續再抽 CSS 做 3D 科技感）======
const wrap: React.CSSProperties = { display: "grid", gap: 12 };
const card: React.CSSProperties = {
  padding: "16px 14px",
  borderRadius: 18,
  border: "1px solid #e6e6e6",
  background: "#fff"
};
const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between"
};
const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #ededed",
  background: "#fafafa",
  fontWeight: 900,
  fontSize: 13
};
const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e5e5e5",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer"
};
const btnPrimary: React.CSSProperties = { ...btn, border: "1px solid #111" };
const choiceGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 10
};
const choiceBtn: React.CSSProperties = {
  padding: "14px 12px",
  borderRadius: 16,
  border: "1px solid #e6e6e6",
  background: "#fff",
  textAlign: "left",
  fontWeight: 900,
  cursor: "pointer"
};

// ====== 輕量訊息卡 ======
function MsgCard({ text, tone }: { text: string; tone: "ok" | "bad" | "info" }) {
  const bg = tone === "ok" ? "#ecfdf5" : tone === "bad" ? "#fff1f2" : "#eff6ff";
  const bd = tone === "ok" ? "#a7f3d0" : tone === "bad" ? "#fecdd3" : "#bfdbfe";
  const fg = "#111";
  return (
    <div style={{ padding: "10px 12px", borderRadius: 14, border: `1px solid ${bd}`, background: bg, color: fg }}>
      {text}
    </div>
  );
}

export default function PracticeSessionPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const sessionId = sp.get("id") || "";
  const [session, setSession] = useState<PracticeSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [shortAnswer, setShortAnswer] = useState<string>("");
  const [msg, setMsg] = useState<{ text: string; tone: "ok" | "bad" | "info" } | null>(null);

  // 提示顯示：固定停留，直到答對進下一題才消失
  const [hintText, setHintText] = useState<string | null>(null);

  // 防止未作答就下一題
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // 計時（暫停時不走）
  useEffect(() => {
    if (!session || session.paused) return;

    const t = setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = { ...prev, elapsedSec: prev.elapsedSec + 1 };
        upsertSession(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(t);
  }, [session]);

  // 初次載入 session
  useEffect(() => {
    if (!sessionId) {
      router.replace("/practice");
      return;
    }

    const s = getSession(sessionId);
    if (!s) {
      router.replace("/practice");
      return;
    }

    setActiveSessionId(s.id);
    setSession(s);
    setQuestions(getMockQuestions(s.subject));
  }, [sessionId, router]);

  const currentQ = useMemo(() => {
    if (!session) return null;
    const idx = Math.min(session.currentIndex, session.totalQuestions - 1);
    // 這裡用 mock 題目輪替示範：之後你會接你自己的題庫出題系統
    const q = questions[idx % Math.max(1, questions.length)];
    return q || null;
  }, [session, questions]);

  // 回合完成（20題）
  const isFinished = !!session && session.currentIndex >= session.totalQuestions - 1 && hasSubmitted;

  if (!session || !currentQ) {
    return (
      <main style={wrap}>
        <div style={card}>載入中…</div>
      </main>
    );
  }

  function backToHub() {
    router.push("/practice");
  }

  function onTogglePause() {
    const next = togglePause(session);
    setSession(next);

    // 暫停時給提示卡（不跳彈窗）
    if (!next.paused) {
      // 继续时不动 msg
      return;
    }
    setMsg({ text: "已暫停，請點「繼續」後再作答。", tone: "info" });
  }

  function onHint() {
    if (session.hintUsed >= session.hintLimit) {
      setMsg({ text: "提示次數已用完。", tone: "info" });
      return;
    }
    const next = useHint(session);
    setSession(next);

    const stepIndex = Math.min(next.hintUsed, currentQ.hintSteps.length) - 1;
    const t = currentQ.hintSteps[Math.max(0, stepIndex)] || "（暫無提示）";
    setHintText(t);
  }

  function resetAnswerUI() {
    setSelectedChoice(null);
    setShortAnswer("");
    setHasSubmitted(false);
    setMsg(null);
    setHintText(null);
  }

  function canSubmit(): boolean {
    if (session.paused) return false;
    if (currentQ.type === "choice") return selectedChoice !== null;
    return shortAnswer.trim().length > 0;
  }

  function onSubmit() {
    if (!canSubmit()) {
      setMsg({ text: "請先作答後再提交。", tone: "info" });
      return;
    }

    const userAns = currentQ.type === "choice" ? (selectedChoice as number) : shortAnswer;
    const { nextSession, correct } = submitAnswer(session, currentQ, userAns);
    setSession(nextSession);
    setHasSubmitted(true);

    if (correct) {
      setMsg({ text: "答對了！請繼續下一題。", tone: "ok" });

      // 答對：停留一下再下一題（不會太快）
      setTimeout(() => {
        const moved = goNext(nextSession);
        setSession(moved);
        resetAnswerUI();
      }, 650);
    } else {
      setMsg({ text: "很可惜沒有答對，再試試看！", tone: "bad" });
      // 答錯不自動下一題，讓使用者自行修正再提交
    }
  }

  function onNextManual() {
    // 只有答對且已提交才允許下一題（避免亂加題數）
    if (!hasSubmitted) {
      setMsg({ text: "請先提交答案。", tone: "info" });
      return;
    }
    if (!msg || msg.tone !== "ok") {
      setMsg({ text: "請先答對本題再前進。", tone: "info" });
      return;
    }
    const moved = goNext(session);
    setSession(moved);
    resetAnswerUI();
  }

  // ====== 題型 UI ======
  const hintRemain = Math.max(0, session.hintLimit - session.hintUsed);

  const answerBlock =
    currentQ.type === "choice" ? (
      <div style={choiceGrid}>
        {currentQ.choices.map((c, idx) => {
          const chosen = selectedChoice === idx;
          return (
            <button
              key={idx}
              style={{
                ...choiceBtn,
                border: chosen ? "1px solid #111" : choiceBtn.border,
                background: chosen ? "#f5f5f5" : "#fff"
              }}
              onClick={() => {
                if (session.paused) return;
                setSelectedChoice(idx);
              }}
            >
              {c}
            </button>
          );
        })}
      </div>
    ) : (
      <div style={{ display: "grid", gap: 10 }}>
        <textarea
          value={shortAnswer}
          onChange={(e) => setShortAnswer(e.target.value)}
          placeholder="請輸入你的答案…"
          style={{
            width: "100%",
            minHeight: 90,
            borderRadius: 16,
            border: "1px solid #e6e6e6",
            padding: "12px 12px",
            fontSize: 16,
            outline: "none"
          }}
          disabled={session.paused}
        />
      </div>
    );

  // ====== 回合完成畫面 ======
  if (session.currentIndex >= session.totalQuestions - 1 && hasSubmitted && msg?.tone === "ok") {
    return (
      <main style={wrap}>
        <h1 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 900 }}>回合完成</h1>
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
            {session.subject}（20 題）
          </div>
          <div style={{ opacity: 0.85, lineHeight: 1.9 }}>
            ⏱ 總用時：{formatTime(session.elapsedSec)}
            <br />
            對：{session.correct}　錯：{session.wrong}
            <br />
            提示使用：{session.hintUsed}/{session.hintLimit}
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              style={btnPrimary}
              onClick={() => {
                // 完成回合後：清掉此進度（避免學習區還顯示未完成）
                removeSession(session.id);
                router.push("/practice");
              }}
            >
              回學習區
            </button>

            <button style={btn} onClick={() => router.push("/")}>
              回首頁
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      {/* 狀態列：科目 / 題數 / 秒數 / 對錯  （都在同一行可換行） */}
      <div style={card}>
        <div style={row}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>
              第 {session.currentIndex + 1} 題 / {session.totalQuestions}
            </span>
            <span style={pill}>⏱ {formatTime(session.elapsedSec)}</span>
            <span style={pill}>
              對：{session.correct} / 錯：{session.wrong}
            </span>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button style={btn} onClick={onTogglePause}>
              {session.paused ? "▶ 繼續" : "⏸ 暫停"}
            </button>

            <button style={btn} onClick={backToHub}>
              ← 回學習區
            </button>
          </div>
        </div>

        {/* 暫停提示卡：只在已暫停時顯示 */}
        {session.paused ? (
          <div style={{ marginTop: 10 }}>
            <MsgCard text="已暫停，請點「繼續」後再作答。" tone="info" />
          </div>
        ) : null}
      </div>

      {/* 題目區 */}
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.6 }}>{currentQ.prompt}</div>

        {/* 右上角：提示（5次），點一次扣一次，提示內容停留直到答對進下一題 */}
        <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button style={btnPrimary} onClick={onHint} disabled={session.paused}>
            提示（{hintRemain}/{session.hintLimit}）
          </button>

          <div style={{ opacity: 0.7, fontSize: 13 }}>
            ※ 提示會停留，直到你答對並進入下一題
          </div>
        </div>

        {hintText ? (
          <div style={{ marginTop: 10 }}>
            <MsgCard text={hintText} tone="info" />
          </div>
        ) : null}
      </div>

      {/* 作答區 */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 10 }}>作答區</div>

        {answerBlock}

        {/* 操作按鈕 */}
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={btnPrimary} onClick={onSubmit}>
            提交答案
          </button>

          <button style={btn} onClick={onNextManual}>
            下一題 →
          </button>
        </div>

        {/* 訊息卡：答對 / 很可惜 */}
        {msg ? (
          <div style={{ marginTop: 10 }}>
            <MsgCard text={msg.text} tone={msg.tone} />
          </div>
        ) : null}
      </div>

      <div style={{ opacity: 0.55, fontSize: 12, lineHeight: 1.7 }}>
        ※ 目前題目為示範 mock（後續會改成你的自建題庫與階段選擇流程）
      </div>
    </main>
  );
}