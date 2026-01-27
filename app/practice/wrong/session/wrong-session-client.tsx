"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// 🔹 复用现有题目型别
import type { Question } from "../../session/question-bank";

// 🔹 读取错题本
import { getWrongBookSnapshot } from "../../../../lib/wrong-book";

// 🔹 用现成的题库 API 根据 qid 抓题
import { getQuestionByIndex } from "../../session/question-bank";

// 🔹 直接复用你已经稳定的 SessionClient
import SessionClient from "../../session/SessionClient";

/**
 * 錯題重練模式說明：
 * - 這個 client 只負責「準備錯題資料」
 * - 實際作答 UI / 流程，全部交給 SessionClient
 * - 不影響原本回合、不寫入原進度
 */
export default function WrongSessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // 從 URL 取得 subject / stage
  const subject = sp.get("subject") ?? "";
  const stage = sp.get("stage") ?? "";

  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    if (!subject || !stage) return;

    // 讀取錯題本快照
    const snapshot = getWrongBookSnapshot();
    const stageQids = snapshot?.[subject]?.[stage] ?? [];

    if (stageQids.length === 0) {
      setQuestions([]);
      return;
    }

    // 將 qid 轉成 Question
    const list: Question[] = [];

    stageQids.forEach((qid, idx) => {
      // 利用現有題庫 API：index 只是占位，不會真的用
      const q = getQuestionByIndex(subject, stage, idx);
      if (q && q.id === qid) {
        list.push(q);
      }
    });

    setQuestions(list);
  }, [subject, stage]);

  // ===== 畫面渲染（真正的頁面輸出）=====
  if (questions.length === 0) {
    return (
      <main style={{ padding: 20 }}>
        <h2>📕 錯題重練</h2>
        <p>這個階段目前沒有錯題。</p>
        <button onClick={() => router.push("/practice/wrong")}>
          回錯題本
        </button>
      </main>
    );
  }

  return (
  <SessionClient
    mode="wrong"
    subject={subject}
    stage={stage}
    questions={questions}
  />
);
}