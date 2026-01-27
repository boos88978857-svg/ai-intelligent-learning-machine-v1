// app/practice/wrong/wrong-client.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  getWrongBookSnapshot,
  onWrongBookUpdated,
  type WrongBookSnapshot,
  clearWrongBook,
} from "../../../lib/wrong-book";

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "16px 14px",
};

const card: React.CSSProperties = {
  padding: "14px",
  borderRadius: 16,
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
  padding: "6px 12px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fafafa",
  fontSize: 13,
  cursor: "pointer",
};

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  marginBottom: 12,
};

const sectionTitle: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 6,
  marginTop: 14,
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

export default function WrongClient() {
  const router = useRouter();

  const [snapshot, setSnapshot] = useState<WrongBookSnapshot>({});

  // 首次加载 + 监听更新
  useEffect(() => {
    const load = () => setSnapshot(getWrongBookSnapshot());
    load();

    const off = onWrongBookUpdated(load);
    return () => off?.();
  }, []);

  const subjects = useMemo(() => Object.keys(snapshot), [snapshot]);

  function goWrongSession(subject: string, stage: string) {
    router.push(
      `/practice/wrong/session?subject=${encodeURIComponent(subject)}&stage=${encodeURIComponent(stage)}`
    );
  }

  function backToPractice() {
    router.push("/practice");
  }

  function onClearAll() {
    clearWrongBook();
  }

  return (
    <main style={wrap}>
      <div style={title}>📕 錯題本</div>

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={row}>
          <button style={btn} onClick={backToPractice}>
            ← 回學習區
          </button>

          <button style={btn} onClick={onClearAll}>
            清空錯題本
          </button>
        </div>
      </div>

      {subjects.length === 0 && (
        <div style={{ opacity: 0.7 }}>目前還沒有錯題，繼續練習吧 💪</div>
      )}

      {subjects.map((subject) => {
        const stages = snapshot[subject] || {};
        const stageKeys = Object.keys(stages);

        // 如果这个 subject 其实都空桶，也不显示
        const hasAny = stageKeys.some((k) => (stages[k] || []).length > 0);
        if (!hasAny) return null;

        return (
          <div key={subject} style={{ marginBottom: 20 }}>
            <div style={sectionTitle}>{subject}</div>

            {stageKeys.map((stage) => {
              const qids = stages[stage] || [];
              if (qids.length === 0) return null;

              return (
                <div key={stage} style={{ ...card, marginBottom: 10 }}>
                  <div style={{ ...row, marginBottom: 8 }}>
                    <strong>{stage}</strong>
                    <span style={{ opacity: 0.6 }}>（{qids.length} 題）</span>
                  </div>

                  <div style={row}>
                    <span
                      style={pill}
                      onClick={() => goWrongSession(subject, stage)}
                    >
                      重練
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </main>
  );
}