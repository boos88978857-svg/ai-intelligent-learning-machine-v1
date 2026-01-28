// app/practice/wrong/wrong-client.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getWrongBookSnapshot, onWrongBookUpdated } from "../../../lib/wrong-book";
import { WRONG_SUBJECTS } from "./subjects";

/**
 * Wrong Book UI:
 * - 沒有錯題：顯示「目前沒有錯題」+ 不顯示科目區（整塊隱藏）
 * - 有錯題：
 *    - 未選 subject：顯示科目列表（只顯示有錯題的科目）
 *    - 選了 subject：顯示該科目的 stages 列表
 */

// ================= 基本樣式（沿用你現有風格，不亂改） =================
const wrap: React.CSSProperties = { maxWidth: 900, margin: "0 auto", padding: "8px 0" };

const card: React.CSSProperties = {
  padding: "14px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
};

const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 12,
  whiteSpace: "nowrap",
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

function countTotal(snapshot: any): number {
  if (!snapshot) return 0;
  let total = 0;
  Object.keys(snapshot).forEach((subject) => {
    const stageMap = snapshot?.[subject] ?? {};
    Object.keys(stageMap).forEach((stage) => {
      const arr = stageMap?.[stage] ?? [];
      total += Array.isArray(arr) ? arr.length : 0;
    });
  });
  return total;
}

function getStagesOfSubject(snapshot: any, subjectKey: string): Array<{ stage: string; count: number }> {
  const stageMap = snapshot?.[subjectKey] ?? {};
  const stages = Object.keys(stageMap)
    .map((stage) => ({
      stage,
      count: Array.isArray(stageMap?.[stage]) ? stageMap[stage].length : 0,
    }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);

  return stages;
}

export default function WrongBookClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const selectedSubject = sp.get("subject") ?? "";

  const [snapshot, setSnapshot] = useState<any>(null);

  const reload = () => {
    const s = getWrongBookSnapshot();
    setSnapshot(s ?? null);
  };

  useEffect(() => {
    reload();
    const off = onWrongBookUpdated(reload);
    return () => off?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalWrong = useMemo(() => countTotal(snapshot), [snapshot]);

  // ✅ 只顯示「有錯題」的科目（你要的：沒錯題就空/隱藏）
  const availableSubjects = useMemo(() => {
    if (!snapshot) return [];
    return WRONG_SUBJECTS.filter((s) => {
      const stages = getStagesOfSubject(snapshot, s.bookKey);
      return stages.length > 0;
    });
  }, [snapshot]);

  // ✅ 選中科目的 stages
  const selectedStages = useMemo(() => {
    if (!selectedSubject) return [];
    return getStagesOfSubject(snapshot, selectedSubject);
  }, [snapshot, selectedSubject]);

  function goBackToSubjectList() {
    router.push("/practice/wrong");
  }

  function goPracticeStage(subject: string, stage: string) {
    router.push(`/practice/wrong/session?subject=${encodeURIComponent(subject)}&stage=${encodeURIComponent(stage)}`);
  }

  return (
    <main style={wrap}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ fontWeight: 900, fontSize: 40, display: "flex", alignItems: "center", gap: 10 }}>
          📕 錯題本
        </div>
      </div>

      <div style={{ opacity: 0.75, marginBottom: 10 }}>先選科目，再選階段重練；答對後會自動移除</div>

      <div style={{ ...row, marginBottom: 10 }}>
        <span style={pill}>總錯題：{totalWrong} 題</span>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={btn} onClick={() => router.push("/practice")}>
            ← 回學習區
          </button>
          <button style={btn} onClick={reload}>
            重新整理
          </button>
        </div>
      </div>

      {/* ✅ 沒錯題：顯示提示 + 科目區整塊隱藏 */}
      {totalWrong === 0 ? (
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>目前還沒有錯題，繼續練習吧 💪</div>
          <div style={{ opacity: 0.75, fontSize: 13 }}>當你答錯時，系統會自動把題目記進錯題本。</div>
        </div>
      ) : (
        <>
          {/* ✅ 有錯題，但未選 subject：顯示科目列表（只顯示有錯題的科目） */}
          {!selectedSubject ? (
            <>
              <div style={{ fontWeight: 900, fontSize: 22, margin: "14px 0 10px" }}>科目</div>

              {availableSubjects.map((s) => {
                const stages = getStagesOfSubject(snapshot, s.bookKey);
                const sum = stages.reduce((acc, x) => acc + x.count, 0);

                return (
                  <div key={s.id} style={{ ...card, marginBottom: 10 }}>
                    <div style={{ ...row }}>
                      <div style={{ fontWeight: 900, fontSize: 18 }}>{s.label}</div>
                      <span style={pill}>{sum} 題</span>
                    </div>

                    <div style={{ height: 10 }} />

                    <button
                      style={btnPrimary}
                      onClick={() => router.push(`/practice/wrong?subject=${encodeURIComponent(s.bookKey)}`)}
                    >
                      進入 {s.label} →
                    </button>
                  </div>
                );
              })}
            </>
          ) : (
            <>
              {/* ✅ 已選 subject：顯示該科目的階段列表 */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 22, margin: "14px 0 10px" }}>
                  {selectedSubject}（{selectedStages.reduce((a, x) => a + x.count, 0)} 題）
                </div>

                <button style={btn} onClick={goBackToSubjectList}>
                  ← 回科目
                </button>
              </div>

              {selectedStages.map((st) => (
                <div key={st.stage} style={{ ...card, marginBottom: 10 }}>
                  <div style={{ ...row }}>
                    <div style={{ fontWeight: 900, fontSize: 18 }}>{st.stage}</div>
                    <span style={pill}>{st.count} 題</span>
                  </div>

                  <div style={{ height: 10 }} />

                  <button style={btnPrimary} onClick={() => goPracticeStage(selectedSubject, st.stage)}>
                    重練本階段 →
                  </button>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </main>
  );
}