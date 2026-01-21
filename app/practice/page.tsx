"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  listSessions,
  removeSession,
  setActiveSessionId,
  formatTime,
  PracticeSession
} from "../../lib/session";

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

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #111"
};

export default function PracticeHubPage() {
  const router = useRouter();
  const [items, setItems] = useState<PracticeSession[]>([]);

  function refresh() {
    setItems(listSessions());
  }

  useEffect(() => {
    refresh();
  }, []);

  function resume(s: PracticeSession) {
    setActiveSessionId(s.id);
    router.push(`/practice/session?id=${encodeURIComponent(s.id)}`);
  }

  function clearOne(s: PracticeSession) {
    removeSession(s.id);
    refresh();
  }

  return (
    <main>
      <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 900 }}>學習區</h1>
      <p style={{ margin: "0 0 14px", opacity: 0.75, lineHeight: 1.7 }}>
        這裡只負責「續做」：你可以同時有多個科目的進度，隨時切換繼續或清除。
      </p>

      {items.length === 0 ? (
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>目前沒有未完成進度</div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            之後你會從「英文/數學/其他」選擇階段後開始作答，進度就會出現在這裡。
          </div>
        </div>
      ) : (
        <div style={wrap}>
          {items.map((s) => (
            <div key={s.id} style={card}>
              <div style={row}>
                <div style={{ fontWeight: 900, fontSize: 18 }}>{s.subject} 進度</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={pill}>第 {s.currentIndex + 1} 題 / {((s as any).totalQuestions ?? (s as any).total ?? (s as any).questionCount ?? (s as any).questions?.length ?? 0)}</span>
                  <span style={pill}>⏱ {formatTime(s.elapsedSec)}</span>
                  <span style={pill}>對：{s.correct} / 錯：{s.wrong}</span>
                  <span style={pill}>提示：{Math.max(0, s.hintLimit - s.hintUsed)}/{s.hintLimit}</span>
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={btnPrimary} onClick={() => resume(s)}>
                  繼續 →
                </button>
                <button style={btn} onClick={() => clearOne(s)}>
                  清除
                </button>
              </div>

              <div style={{ marginTop: 10, opacity: 0.55, fontSize: 12 }}>
                進度ID：{s.id}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}