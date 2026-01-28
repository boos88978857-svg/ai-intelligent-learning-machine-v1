// app/practice/wrong/wrong-client.tsx
"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

import { getWrongBookSnapshot, type WrongBookSnapshot } from "../../../lib/wrong-book";

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "16px 14px",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
  marginBottom: 14,
};

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
};

const subTitle: React.CSSProperties = {
  opacity: 0.65,
  fontSize: 13,
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 900,
  marginTop: 14,
  marginBottom: 10,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
};

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 16,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const cardTop: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 10,
};

const stageTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
};

const badge: React.CSSProperties = {
  padding: "3px 10px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fafafa",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const btnRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  marginTop: 10,
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

export default function WrongClient() {
  const router = useRouter();

  const snapshot: WrongBookSnapshot = useMemo(() => {
    return getWrongBookSnapshot();
  }, []);

  const subjects = Object.keys(snapshot);

  function goWrongSession(subject: string, stage: string) {
    router.push(
      `/practice/wrong/session?subject=${encodeURIComponent(subject)}&stage=${encodeURIComponent(stage)}`
    );
  }

  function countSubjectTotal(stages: Record<string, string[]>) {
    return Object.values(stages).reduce((sum, arr) => sum + (arr?.length ?? 0), 0);
  }

  function countAllTotal() {
    return subjects.reduce((sum, s) => sum + countSubjectTotal(snapshot[s] || {}), 0);
  }

  return (
    <main style={wrap}>
      {/* ===== Header ===== */}
      <div style={headerRow}>
        <div>
          <div style={title}>📕 錯題本</div>
          <div style={subTitle}>
            依「科目 → 階段」整理錯題，答對後會自動移除
          </div>
        </div>

        <div style={badge}>總錯題：{countAllTotal()} 題</div>
      </div>

      {subjects.length === 0 && (
        <div style={{ opacity: 0.7 }}>目前還沒有錯題，繼續練習吧 💪</div>
      )}

      {/* ===== Subject Sections ===== */}
      {subjects.map((subject) => {
        const stages = snapshot[subject];
        const stageKeys = Object.keys(stages);

        return (
          <div key={subject}>
            <div style={sectionTitle}>
              {subject}（{countSubjectTotal(stages)} 題）
            </div>

            <div style={grid}>
              {stageKeys.map((stage) => {
                const qids = stages[stage];
                if (!qids || qids.length === 0) return null;

                return (
                  <div key={stage} style={card}>
                    <div style={cardTop}>
                      <div style={stageTitle}>{stage}</div>
                      <span style={badge}>{qids.length} 題</span>
                    </div>

                    <div style={{ opacity: 0.7, fontSize: 13 }}>
                      尚未掌握的題目，建議完整重練
                    </div>

                    <div style={btnRow}>
                      <button
                        style={btnPrimary}
                        onClick={() => goWrongSession(subject, stage)}
                      >
                        重練本階段 →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </main>
  );
}