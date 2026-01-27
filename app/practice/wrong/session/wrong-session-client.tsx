// app/practice/wrong/session/wrong-session-client.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getWrongBookSnapshot } from "../../../../lib/wrong-book";
import { getQuestionByIndex, getStageCount, type Question } from "../../session/question-bank";

import SessionClient from "../../session/SessionClient";

/**
 * 錯題重練專用 Client
 * - 不讀原本進度
 * - 只使用錯題本 qids
 * - ⚠️ 不要訂閱 onWrongBookUpdated：避免重練中題單被刷新變短 → 提前完成
 */
export default function WrongSessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const subject = sp.get("subject") ?? "";
  const stage = sp.get("stage") ?? "";

  const [questions, setQuestions] = useState<Question[]>([]);

  // ✅ 把 qid 轉 Question：用「掃描題庫」找同 id（避免 idx 對不上）
  function findQuestionById(subject: string, stage: string, qid: string): Question | null {
    const n = getStageCount(subject, stage);
    for (let i = 0; i < n; i++) {
      const q = getQuestionByIndex(subject, stage, i);
      if (q && q.id === qid) return q;
    }
    return null;
  }

  const load = () => {
    if (!subject || !stage) {
      setQuestions([]);
      return;
    }

    const snapshot = getWrongBookSnapshot();
    const stageQids = snapshot?.[subject]?.[stage] ?? [];

    if (stageQids.length === 0) {
      setQuestions([]);
      return;
    }

    const list: Question[] = [];
    for (const qid of stageQids) {
      const q = findQuestionById(subject, stage, qid);
      if (q) list.push(q);
    }

    setQuestions(list);
  };

  // ✅ 只在進入這個 subject+stage 時載入一次（不要在重練中跟著 localStorage 變動）
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject, stage]);

  const hasParams = useMemo(() => !!subject && !!stage, [subject, stage]);

  if (!hasParams) {
    return (
      <main style={{ padding: 20 }}>
        <h2>📕 錯題重練</h2>
        <p>缺少參數，無法進入錯題重練。</p>
        <button onClick={() => router.push("/practice/wrong")}>回錯題本</button>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main style={{ padding: 20 }}>
        <h2>📕 錯題重練</h2>
        <p>這個階段目前沒有錯題。</p>
        <button onClick={() => router.push("/practice/wrong")}>回錯題本</button>
      </main>
    );
  }

  return <SessionClient mode="wrong" subject={subject} stage={stage} questions={questions} />;
}