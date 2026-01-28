"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getWrongBookSnapshot, onWrongBookUpdated } from "../../../lib/wrong-book";

/** ================= 样式 ================= */
const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "18px 14px" };

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const title: React.CSSProperties = { fontSize: 34, fontWeight: 900, display: "flex", gap: 10, alignItems: "center" };
const subTitle: React.CSSProperties = { marginTop: 6, opacity: 0.7, fontSize: 14 };

const badge: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 13,
  whiteSpace: "nowrap",
};

const sectionTitle: React.CSSProperties = { marginTop: 16, marginBottom: 10, fontSize: 18, fontWeight: 900 };

const grid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(1, minmax(0, 1fr))", gap: 12 };

const card: React.CSSProperties = {
  padding: "14px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const cardTop: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 };

const stageTitle: React.CSSProperties = { fontSize: 20, fontWeight: 900 };

const btnRow: React.CSSProperties = { marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };

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

const btnGhost: React.CSSProperties = {
  ...btn,
  background: "#fff",
};

export default function WrongClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // ✅ 新增：用 query 控制层级
  const subjectParam = (sp.get("subject") ?? "").trim();

  const [snapshot, setSnapshot] = useState<Record<string, Record<string, string[]>>>({});

  useEffect(() => {
    const load = () => {
      const s = getWrongBookSnapshot() || {};
      setSnapshot(s);
    };
    load();
    const off = onWrongBookUpdated(load);
    return () => off?.();
  }, []);

  const subjects = useMemo(() => Object.keys(snapshot || {}).sort(), [snapshot]);

  function countAllTotal() {
    let total = 0;
    for (const subj of Object.keys(snapshot || {})) {
      const stages = snapshot[subj] || {};
      for (const st of Object.keys(stages)) total += (stages[st]?.length ?? 0);
    }
    return total;
  }

  function countSubjectTotal(stages: Record<string, string[]>) {
    let total = 0;
    for (const st of Object.keys(stages || {})) total += (stages[st]?.length ?? 0);
    return total;
  }

  function goWrongSession(subject: string, stage: string) {
    router.push(
      `/practice/wrong/session?subject=${encodeURIComponent(subject)}&stage=${encodeURIComponent(stage)}`
    );
  }

  function goSubject(subject: string) {
    router.push(`/practice/wrong?subject=${encodeURIComponent(subject)}`);
  }

  function backToAllSubjects() {
    router.push("/practice/wrong");
  }

  /** ================= 视图 A：科目列表 ================= */
  if (!subjectParam) {
    return (
      <main style={wrap}>
        <div style={headerRow}>
          <div>
            <div style={title}>📕 錯題本</div>
            <div style={subTitle}>先選科目，再選階段重練；答對後會自動移除</div>
          </div>

          <div style={badge}>總錯題：{countAllTotal()} 題</div>
        </div>

        {subjects.length === 0 ? (
          <div style={{ marginTop: 16, opacity: 0.7 }}>目前還沒有錯題，繼續練習吧 💪</div>
        ) : null}

        <div style={sectionTitle}>科目</div>

        <div style={grid}>
          {subjects.map((subj) => {
            const stages = snapshot[subj] || {};
            const total = countSubjectTotal(stages);
            if (total === 0) return null;

            return (
              <div key={subj} style={card}>
                <div style={cardTop}>
                  <div style={stageTitle}>{subj}</div>
                  <span style={badge}>{total} 題</span>
                </div>

                <div style={{ opacity: 0.7, fontSize: 13, marginTop: 6 }}>
                  進入後可看到各階段錯題
                </div>

                <div style={btnRow}>
                  <button style={btnPrimary} onClick={() => goSubject(subj)}>
                    進入科目 →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    );
  }

  /** ================= 视图 B：某科目下的阶段列表 ================= */
  const stages = snapshot?.[subjectParam] || {};
  const stageKeys = Object.keys(stages).sort();
  const subjectTotal = countSubjectTotal(stages);

  return (
    <main style={wrap}>
      <div style={headerRow}>
        <div>
          <div style={title}>📕 錯題本</div>
          <div style={subTitle}>
            科目：<b>{subjectParam}</b>（{subjectTotal} 題）｜答對後會自動移除
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={btnGhost} onClick={backToAllSubjects}>
            ← 回科目列表
          </button>
          <div style={badge}>總錯題：{countAllTotal()} 題</div>
        </div>
      </div>

      {subjectTotal === 0 ? (
        <div style={{ marginTop: 16, opacity: 0.7 }}>這個科目目前沒有錯題。</div>
      ) : null}

      <div style={sectionTitle}>階段</div>

      <div style={grid}>
        {stageKeys.map((stage) => {
          const qids = stages[stage] || [];
          if (qids.length === 0) return null;

          return (
            <div key={stage} style={card}>
              <div style={cardTop}>
                <div style={stageTitle}>{stage}</div>
                <span style={badge}>{qids.length} 題</span>
              </div>

              <div style={{ opacity: 0.7, fontSize: 13, marginTop: 6 }}>
                尚未掌握的題目，建議完整重練
              </div>

              <div style={btnRow}>
                <button style={btnPrimary} onClick={() => goWrongSession(subjectParam, stage)}>
                  重練本階段 →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}