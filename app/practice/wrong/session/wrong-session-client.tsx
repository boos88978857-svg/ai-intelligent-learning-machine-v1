// app/practice/wrong/session/wrong-session-client.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getWrongBookSnapshot, onWrongBookUpdated } from "../../../../lib/wrong-book";
import { getQuestionByIndex, getStageCount, type Question } from "../../session/question-bank";

import SessionClient from "../../session/SessionClient";

/**
 * 錯題重練專用 Client
 * - 不讀原本進度
 * - 只使用錯題本 qids
 * - 答對就自動 removeWrongQuestion（這部分你已經在 SessionClient 做好了）
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

  // 首次加载 + 监听错题本更新（答对会 remove，页面会立刻刷新）
  useEffect(() => {
    load();
    const off = onWrongBookUpdated(load);
    return () => off?.();
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

  // ✅ 关键：用 wrong 模式交给 SessionClient（你已经做了：答对自动 remove）
  return (
    <SessionClient
      mode="wrong"
      subject={subject}
      stage={stage}
      questions={questions}
    />
  );
}