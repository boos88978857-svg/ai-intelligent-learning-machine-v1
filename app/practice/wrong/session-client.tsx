// app/practice/wrong/session-client.tsx
"use client";

import React, { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import { getWrongBookSnapshot } from "../../../lib/wrong-book";
import { getQuestionById, type Question } from "../session/question-bank";

export default function WrongSessionClient() {
  const router = useRouter();
  const sp = useSearchParams();

  // 1️⃣ 从 URL 读取 subject / stage
  const subject = sp.get("subject") ?? "";
  const stage = sp.get("stage") ?? "";

  // 2️⃣ 读取错题本快照
  const snapshot = useMemo(() => {
    return getWrongBookSnapshot();
  }, []);

  // 3️⃣ 拿到该 subject + stage 的错题 qid 列表
  const qids: string[] = useMemo(() => {
    return snapshot?.[subject]?.[stage] ?? [];
  }, [snapshot, subject, stage]);

  // 4️⃣ 暂时只验证数据是否正确
  return (
    <main style={{ padding: 16 }}>
      <h1>錯題重練（Debug）</h1>

      <div>科目：{subject || "—"}</div>
      <div>階段：{stage || "—"}</div>
      <div>錯題數：{qids.length}</div>

      <pre
        style={{
          marginTop: 12,
          padding: 12,
          background: "#f5f5f5",
          borderRadius: 8,
          fontSize: 12,
        }}
      >
        {JSON.stringify(qids, null, 2)}
      </pre>

      <button
        style={{ marginTop: 16 }}
        onClick={() => router.back()}
      >
        ← 返回
      </button>
    </main>
  );
}