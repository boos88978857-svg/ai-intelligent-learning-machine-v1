// app/practice/wrong/wrong-client.tsx
"use client";

import React, { useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  getWrongBookSnapshot,
  type WrongBookSnapshot,
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
  padding: "4px 10px",
  borderRadius: 999,
  border: "1px solid #ddd",
  background: "#fafafa",
  fontSize: 12,
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

export default function WrongClient() {
  const router = useRouter();

  const snapshot: WrongBookSnapshot = useMemo(() => {
    return getWrongBookSnapshot();
  }, []);

  const subjects = Object.keys(snapshot);

  function goPractice(subject: string, stage: string, qid: string) {
    router.push(
      `/practice/session?wrong=1&subject=${encodeURIComponent(
        subject
      )}&stage=${encodeURIComponent(stage)}&qid=${encodeURIComponent(qid)}`
    );
  }

  return (
    <main style={wrap}>
      <div style={title}>📕 錯題本</div>

      {subjects.length === 0 && (
        <div style={{ opacity: 0.7 }}>
          目前還沒有錯題，繼續練習吧 💪
        </div>
      )}

      {subjects.map((subject) => {
        const stages = snapshot[subject];

        return (
          <div key={subject} style={{ marginBottom: 20 }}>
            <div style={sectionTitle}>{subject}</div>

            {Object.keys(stages).map((stage) => {
              const qids = stages[stage];

              if (!qids || qids.length === 0) return null;

              return (
                <div key={stage} style={{ ...card, marginBottom: 10 }}>
                  <div style={{ ...row, marginBottom: 8 }}>
                    <strong>{stage}</strong>
                    <span style={{ opacity: 0.6 }}>
                      （{qids.length} 題）
                    </span>
                  </div>

                  <div style={row}>
                    {qids.map((qid) => (
                      <span
                        key={qid}
                        style={pill}
                        onClick={() =>
                          goPractice(subject, stage, qid)
                        }
                      >
                        重練
                      </span>
                    ))}
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