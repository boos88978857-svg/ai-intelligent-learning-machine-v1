"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  listSessions,
  removeSession,
  setActiveSessionId,
  formatTime,
  PracticeSession,
  createSession,
} from "../../lib/session";

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

/* ================= 页面本体 ================= */

export default function PracticePage() {
  const router = useRouter();
  const sp = useSearchParams();

  const [sessions, setSessions] = useState<PracticeSession[]>([]);

  /* ====== 读取 URL 参数 ====== */
  const subject = sp.get("subject");
  const stage = sp.get("stage");

  /* ====== 初始化：如果有 subject，就确保有进度 ====== */
  useEffect(() => {
    // 1️⃣ 先读现有进度
    const all = listSessions();
    setSessions(all);

    // 2️⃣ 如果是从「阶段卡」进来的
    if (subject) {
      // 是否已经有同科目的未完成进度
      const exist = all.find(
        (s) => s.subject === subject && !s.finished
      );

      if (exist) {
        setActiveSessionId(exist.id);
        router.replace(`/practice/session?id=${exist.id}`);
        return;
      }

      // 3️⃣ 没有就新建一个（v1：不管 stage，只记录）
      const created = createSession(subject as any);
      setActiveSessionId(created.id);
      router.replace(`/practice/session?id=${created.id}`);
    }
  }, [subject, stage, router]);

  /* ================= UI ================= */

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 20, marginBottom: 6 }}>
          學習區
        </div>
        <div style={{ opacity: 0.7, fontSize: 14 }}>
          這裡只負責「續做」：你可以同時有多個科目的進度，隨時切換或清除。
        </div>
      </div>

      <div style={{ height: 12 }} />

      {sessions.length === 0 ? (
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>
            目前沒有未完成進度
          </div>
          <div style={{ opacity: 0.7, fontSize: 14 }}>
            之後你會從「英文 / 數學 / 其他」選擇階段後開始作答，進度就會出現在這裡。
          </div>
        </div>
      ) : (
        sessions.map((s) => (
          <div key={s.id} style={{ ...card, marginBottom: 10 }}>
            <div style={row}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={pill}>科目：{s.subject}</span>
                <span style={pill}>第 {s.currentIndex + 1} 題</span>
                <span style={pill}>⏱ {formatTime(s.elapsedSec)}</span>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  style={btnPrimary}
                  onClick={() => {
                    setActiveSessionId(s.id);
                    router.push(`/practice/session?id=${s.id}`);
                  }}
                >
                  繼續
                </button>

                <button
                  style={btn}
                  onClick={() => {
                    removeSession(s.id);
                    setSessions(listSessions());
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