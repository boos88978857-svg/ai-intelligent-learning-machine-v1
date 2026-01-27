// app/practice/wrong/session/wrong-session-client.tsx
"use client";

import React, { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { getWrongBookSnapshot } from "../../../../lib/wrong-book";
import { getQuestionById, type Question } from "../../session/question-bank";

import SessionClient from "../../session/SessionClient";

/**
 * 錯題重練專用 Client
 * - 不讀原本進度
 * - 只用錯題本 qids
 */
export default function WrongSessionClient() {
  const router = useRouter();
  const search = useSearchParams();

  const subject = search.get("subject") ?? "";
  const stage = search.get("stage") ?? "";

  // 讀錯題本
  const wrongQids: string[] = useMemo(() => {
    const snapshot = getWrongBookSnapshot();
    return snapshot?.[subject]?.[stage] ?? [];
  }, [subject, stage]);

  // 沒參數 → 回錯題本首頁
  if (!subject || !stage) {
    return (
      <main style={{ padding: 20 }}>
        <p>缺少參數，無法進入錯題重練。</p>
        <button onClick={() => router.push("/practice/wrong")}>
          回錯題本
        </button>
      </main>
    );
  }

  // 沒錯題
  if (wrongQids.length === 0) {
    return (
      <main style={{ padding: 20 }}>
        <h2>🎉 太好了</h2>
        <p>
          <strong>{subject}</strong> / <strong>{stage}</strong> 目前沒有錯題
        </p>
        <button onClick={() => router.push("/practice/wrong")}>
          回錯題本
        </button>
      </main>
    );
  }

  /**
   * 將錯題 qids 轉成 Question[]
   * 避免 question-bank 裡不存在的題目
   */
  const questions: Question[] = wrongQids
    .map((qid) => getQuestionById(qid))
    .filter((q): q is Question => Boolean(q));

  // 理論上不該發生，但防炸
  if (questions.length === 0) {
    return (
      <main style={{ padding: 20 }}>
        <p>錯題資料異常，請重新練習後再試。</p>
        <button onClick={() => router.push("/practice/wrong")}>
          回錯題本
        </button>
      </main>
    );
  }

  return (
  <SessionClient
    subject={subject}
    stage={stage}
    questions={questions}
  />
);
}