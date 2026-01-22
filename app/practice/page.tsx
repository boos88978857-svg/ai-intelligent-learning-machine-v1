"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ✅ 不用具名 import，避免“未导出成员”导致编译失败
import * as S from "../../lib/session";
import type { PracticeSession } from "../../lib/session";

/* ================= 基础样式 ================= */

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "12px 0",
};

const card: React.CSSProperties = {
  padding: "16px 14px",
  borderRadius: 18,
  border: "1px solid #e6e6e6",
  background: "#fff",
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
  border: "1px solid #ededed",
  background: "#fafafa",
  fontWeight: 900,
  fontSize: 13,
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e5e5e5",
  background: "#fff",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
};

/* ================= 兼容层：自动找得到你 lib/session 里的函数 ================= */

function getFns() {
  const anyS = S as any;

  const listSessions =
    anyS.listSessions ||
    anyS.列出進度 ||
    anyS.getAllSessions ||
    anyS.readAll ||
    (() => []);

  const removeSession =
    anyS.removeSession ||
    anyS.刪除進度 ||
    anyS.deleteSession ||
    anyS.remove ||
    (() => {});

  const setActiveSessionId =
    anyS.setActiveSessionId ||
    anyS.設定目前進度id ||
    anyS.setCurrentSessionId ||
    (() => {});

  const formatTime =
    anyS.formatTime ||
    anyS.格式化時間 ||
    ((sec: number) => `${sec}s`);

  // ✅ 创建 session 的函数名兼容
  const create =
    anyS.createSession ||
    anyS.newSession ||
    anyS.新增進度 ||
    anyS.建立新進度;

  return { listSessions, removeSession, setActiveSessionId, formatTime, create };
}

/* ================= 外层：只负责 Suspense（解决 useSearchParams build 报错） ================= */

export default function PracticePage() {
  return (
    <Suspense fallback={<PracticeLoading />}>
      <PracticeInner />
    </Suspense>
  );
}

function PracticeLoading() {
  return (
    <main style={wrap}>
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 6 }}>學習區</div>
        <div style={{ opacity: 0.7, fontSize: 14 }}>讀取中…</div>
      </div>
    </main>
  );
}

/* ================= 内层：真正用 useSearchParams 的页面逻辑 ================= */

function PracticeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  const subject = sp.get("subject"); // 例如：英文
  const stage = sp.get("stage"); // 例如：A1 / APPLIED（v1 先不做题库逻辑）

  useEffect(() => {
    const { listSessions, setActiveSessionId, create } = getFns();

    const all: PracticeSession[] = listSessions();
    setSessions(all);

    // ✅ 从“阶段卡”进来：/practice?subject=英文&stage=A1
    if (subject) {
      const exist = all.find((s: any) => s?.subject === subject && !s?.finished);

      if (exist) {
        setActiveSessionId(exist.id);
        router.replace(`/practice/session?id=${encodeURIComponent(exist.id)}`);
        return;
      }

      if (!create) {
        console.error("lib/session 找不到 createSession / newSession / 新增進度 / 建立新進度");
        return;
      }

      const created: PracticeSession = create(subject);
      setActiveSessionId((created as any).id);
      router.replace(`/practice/session?id=${encodeURIComponent((created as any).id)}`);
    }
  }, [subject, stage, router]);

  const { removeSession, setActiveSessionId, formatTime } = getFns();

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 6 }}>學習區</div>
        <div style={{ opacity: 0.7, fontSize: 14 }}>
          這裡只負責「續做」：你可以同時有多個科目的進度，隨時切換或清除。
        </div>
      </div>

      <div style={{ height: 12 }} />

      {sessions.length === 0 ? (
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>目前沒有未完成進度</div>
          <div style={{ opacity: 0.7, fontSize: 14 }}>
            你可以從英文專區選 A1/A2… 進來，系統會自動建立一個進度並進入作答頁。
          </div>
        </div>
      ) : (
        sessions.map((s: any) => (
          <div key={s.id} style={{ ...card, marginBottom: 10 }}>
            <div style={row}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={pill}>科目：{s.subject}</span>
                <span style={pill}>第 {Number(s.currentIndex ?? 0) + 1} 題</span>
                <span style={pill}>⏱ {formatTime(Number(s.elapsedSec ?? 0))}</span>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={btnPrimary}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    router.push(`/practice/session?id=${encodeURIComponent(s.id)}`);
                  }}
                >
                  繼續
                </button>

                <button
                  style={btn}
                  onClick={() => {
                    removeSession(s.id);
                    setSessions(getFns().listSessions());
                  }}
                >
                  清除
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </main>
  );
}