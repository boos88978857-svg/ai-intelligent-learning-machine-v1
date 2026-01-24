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
  type Subject,
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

const pillBtn: React.CSSProperties = {
  ...pill,
  cursor: "pointer",
  background: "#fff",
};

type MCQ = {
  stem: string; // 題幹
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  answer: "A" | "B" | "C" | "D";
};

const TOTAL_PER_ROUND = 20;

/* ================= 題庫（v3-1 demo） =================
   你後續會換成正式題庫/後端，這裡先用最小可跑版本。
*/
function getQuestionsForEnglishStage(stage: string): MCQ[] {
  // 先給一組固定題（足夠循環到 20 題）
  // 你可以之後把不同 stage 對應不同題庫。
  const bank: MCQ[] = [
    {
      stem: "選出「藍色」的英文：",
      options: [
        { key: "A", text: "blue" },
        { key: "B", text: "apple" },
        { key: "C", text: "run" },
        { key: "D", text: "happy" },
      ],
      answer: "A",
    },
    {
      stem: "選出「蘋果」的英文：",
      options: [
        { key: "A", text: "book" },
        { key: "B", text: "apple" },
        { key: "C", text: "milk" },
        { key: "D", text: "cold" },
      ],
      answer: "B",
    },
    {
      stem: "選出「跑」的英文：",
      options: [
        { key: "A", text: "sleep" },
        { key: "B", text: "run" },
        { key: "C", text: "eat" },
        { key: "D", text: "rain" },
      ],
      answer: "B",
    },
    {
      stem: "選出「快樂」的英文：",
      options: [
        { key: "A", text: "sad" },
        { key: "B", text: "angry" },
        { key: "C", text: "happy" },
        { key: "D", text: "tired" },
      ],
      answer: "C",
    },
  ];

  // stage 目前只是展示（你要更細分也行）
  // 這裡先直接回同一組
  return bank;
}

function getStage(session: PracticeSession): string {
  return ((session as any).stage ?? "-") as string;
}

function isEnglish(session: PracticeSession): boolean {
  return session.subject === ("英文" as Subject);
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const [session, setSession] = useState<PracticeSession | null>(null);

  // 題目/作答狀態
  const [selected, setSelected] = useState<"A" | "B" | "C" | "D" | null>(null);
  const [locked, setLocked] = useState(false); // 按下「確定」後鎖住，等待自動下一題
  const [feedback, setFeedback] = useState<string | null>(null);

  // 提示
  const [hintText, setHintText] = useState<string | null>(null);

  // 白板
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  // 計時
  const timerRef = useRef<number | null>(null);

  // 自動下一題計時器（2 秒）
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

    // v3-1：提示次數固定 5（如果舊資料不是 5，這裡直接矯正）
    const normalized = { ...s, hintLimit: 5 } as PracticeSession;

    setSession(normalized);
    setSelected(null);
    setLocked(false);
    setFeedback(null);
    setHintText(null);

    // 同步寫回，確保下次讀取一致
    寫入進度(normalized);
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
        const next = { ...prev, elapsedSec: (prev.elapsedSec ?? 0) + 1 };
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

  /* ================= 題庫 ================= */
  const questions = useMemo(() => {
    if (!session) return [] as MCQ[];
    if (!isEnglish(session)) return [] as MCQ[];
    return getQuestionsForEnglishStage(getStage(session));
  }, [session]);

  const currentQ = useMemo(() => {
    if (!session) return null;
    if (questions.length === 0) return null;
    const idx = session.currentIndex ?? 0;
    return questions[idx % questions.length] ?? null;
  }, [questions, session]);

  const isFinished = useMemo(() => {
    if (!session) return false;
    return (session.currentIndex ?? 0) >= TOTAL_PER_ROUND;
  }, [session]);

  /* ================= 行為規則 ================= */
  const canInteract = !!session && !session.paused && !locked && !isFinished;

  const canHint = useMemo(() => {
    if (!session) return false;
    return (session.hintUsed ?? 0) < (session.hintLimit ?? 5) && !session.paused && !isFinished;
  }, [session, isFinished]);

  function backToPractice() {
    // 不帶參數，避免觸發自動建進度造成閃跳
    router.replace("/practice");
  }

  function togglePause() {
    if (!session) return;

    // 暫停時：要把 autoNext 停掉，避免背景跳題
    if (autoNextRef.current) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }

    const next = { ...session, paused: !session.paused };
    寫入進度(next);
    setSession(next);
  }

  function onHint() {
    if (!session) return;
    if (!canHint) return;

    const next = { ...session, hintUsed: (session.hintUsed ?? 0) + 1 };
    寫入進度(next);
    setSession(next);

    // demo：固定提示文字（你之後接 AI/題庫提示）
    setHintText("提示：先看題幹關鍵字，再對照選項排除明顯不對的。");
  }

  function chooseOption(k: "A" | "B" | "C" | "D") {
    if (!canInteract) return;
    setSelected(k);
    setFeedback(null);
  }

  function confirmAnswer() {
    if (!session) return;
    if (!canInteract) return;
    if (!currentQ) return;
    if (!selected) return;

    const correct = selected === currentQ.answer;

    const next: PracticeSession = {
      ...session,
      correctCount: (session.correctCount ?? 0) + (correct ? 1 : 0),
      wrongCount: (session.wrongCount ?? 0) + (correct ? 0 : 1),
    };

    寫入進度(next);
    setSession(next);

    setLocked(true);
    setFeedback(correct ? "✅ 答對了！2 秒後自動下一題…" : "❌ 答錯了！2 秒後自動下一題…");

    // 2 秒後自動下一題（若暫停就不跳）
    if (autoNextRef.current) {
      window.clearTimeout(autoNextRef.current);
      autoNextRef.current = null;
    }

    autoNextRef.current = window.setTimeout(() => {
      setSession((prev) => {
        if (!prev) return prev;
        if (prev.paused) return prev; // 暫停就不跳

        const idx = (prev.currentIndex ?? 0) + 1;
        const moved = { ...prev, currentIndex: idx };

        寫入進度(moved);

        return moved;
      });

      setSelected(null);
      setLocked(false);
      setFeedback(null);
      setHintText(null);
      autoNextRef.current = null;
    }, 2000);
  }

  // component unmount 時清掉 timeout
  useEffect(() => {
    return () => {
      if (autoNextRef.current) {
        window.clearTimeout(autoNextRef.current);
        autoNextRef.current = null;
      }
    };
  }, []);

  /* ================= Loading ================= */
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

  /* ================= 完成頁（20 題） ================= */
  if (isFinished) {
    const stage = getStage(session);
    return (
      <main style={wrap}>
        {/* ✅ 右上不再放「回學習區」標籤，避免你說的多一個 */}
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 30, marginBottom: 10 }}>🎉 本回合完成</div>

          <div style={{ ...row, marginBottom: 10 }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{stage}</span>
            <span style={pill}>題數：{TOTAL_PER_ROUND}/{TOTAL_PER_ROUND}</span>
            <span style={pill}>用時：{格式化時間(session.elapsedSec ?? 0)}</span>
          </div>

          <div style={{ ...row, marginBottom: 14 }}>
            <span style={pill}>答對：{session.correctCount ?? 0}</span>
            <span style={pill}>答錯：{session.wrongCount ?? 0}</span>
          </div>

          <button style={btnPrimary} onClick={backToPractice}>
            回學習區
          </button>

          <div style={{ height: 8 }} />
          <div style={{ opacity: 0.65, fontSize: 13, lineHeight: 1.6 }}>
            ＊你剛剛提的「同階段完成後應該開新回合、完成的移到記錄」我已幫你記下來，
            等 v3 流程走完再做回合管理調整。
          </div>
        </div>
      </main>
    );
  }

  const stage = getStage(session);

  return (
    <main style={wrap}>
      {/* ========= 最上排：把「回上一頁」放到最頂端右側（貼近關於那排） ========= */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 2px", marginBottom: 8 }}>
        <button style={btn} onClick={backToPractice}>
          ← 回上一頁
        </button>
      </div>

      {/* ========= 狀態區（把計時+暫停放回你要的右上位置） ========= */}
      <div style={card}>
        <div
          style={{
            display: "flex",
            gap: 10,
            flexWrap: "nowrap",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", minWidth: 0 }}>
            <span style={pill}>科目：{session.subject}</span>
            <span style={pill}>階段：{stage}</span>
            <span style={pill}>
              第 {Math.min((session.currentIndex ?? 0) + 1, TOTAL_PER_ROUND)} / {TOTAL_PER_ROUND} 題
            </span>
          </div>

          {/* 右上：計時 + 暫停 */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <span style={pill}>⏱ {格式化時間(session.elapsedSec ?? 0)}</span>
            <button onClick={togglePause} style={pillBtn}>
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

      {/* ========= 題目區 ========= */}
      <div style={card}>
        <div style={{ ...row, justifyContent: "space-between" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>題目</div>

          {/* ✅ 對/錯：整回合累計（不會每題歸零） */}
          <div style={{ display: "flex", gap: 8 }}>
            <span style={pill}>對：{session.correctCount ?? 0}</span>
            <span style={pill}>錯：{session.wrongCount ?? 0}</span>
          </div>
        </div>

        <div style={{ height: 10 }} />

        {currentQ ? (
          <>
            <div style={{ fontSize: 18, lineHeight: 1.8, marginBottom: 12 }}>
              第 {Math.min((session.currentIndex ?? 0) + 1, TOTAL_PER_ROUND)} 題（{stage}）：{currentQ.stem}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {currentQ.options.map((op) => {
                const active = selected === op.key;
                return (
                  <button
                    key={op.key}
                    onClick={() => chooseOption(op.key)}
                    disabled={!canInteract}
                    style={{
                      ...btn,
                      textAlign: "left",
                      padding: "12px 12px",
                      borderRadius: 14,
                      border: active ? "1px solid #111" : "1px solid #ddd",
                      background: active ? "#111" : "#fff",
                      color: active ? "#fff" : "#1a1a1a",
                      opacity: !canInteract ? 0.6 : 1,
                    }}
                  >
                    {op.key}. {op.text}
                  </button>
                );
              })}
            </div>

            <div style={{ height: 12 }} />

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button
                style={btnPrimary}
                onClick={confirmAnswer}
                disabled={!canInteract || !selected}
              >
                確定
              </button>

              {feedback ? (
                <span style={{ ...pill, background: "#f5f5f5" }}>{feedback}</span>
              ) : (
                <span style={{ opacity: 0.7, fontSize: 13 }}>
                  先選一個選項，再按「確定」。
                </span>
              )}
            </div>
          </>
        ) : (
          <div style={{ opacity: 0.75, lineHeight: 1.8 }}>
            （暫無題目）目前只先支援「英文」示範題庫；其他科目會在 v3 後續補上。
          </div>
        )}
      </div>

      <div style={{ height: 10 }} />

      {/* ========= 提示區（拿掉“提示”標題，左上直接是可點的顯示提示） ========= */}
      <div style={card}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            style={{ ...btn, opacity: canHint ? 1 : 0.5 }}
            onClick={onHint}
            disabled={!canHint}
          >
            顯示提示
          </button>

          <span style={pill}>
            {(session.hintUsed ?? 0)}/{session.hintLimit ?? 5}
          </span>

          {/* ✅ 塗鴉牆移到你圈的位置（同一排偏右） */}
          <button style={btn} onClick={() => setWhiteboardOpen(true)}>
            📝 塗鴉牆
          </button>
        </div>

        <div
          style={{
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            border: "1px dashed #e0e0e0",
            opacity: hintText ? 1 : 0.8,
            lineHeight: 1.8,
          }}
        >
          {hintText ? hintText : "尚未使用提示。"}
        </div>
      </div>

      {/* Whiteboard 本體：必須在 </main> 前 */}
      <Whiteboard open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} />
    </main>
  );
}