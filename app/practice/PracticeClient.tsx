"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  subject?: string; // 例：英文
  stage?: string;   // 例：A1 / APPLIED
};

type AnySession = any;

const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "8px 0" };
const card: React.CSSProperties = {
  padding: "14px 14px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 13,
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

async function withSessionLib<T>(fn: (m: any) => T | Promise<T>) {
  const m = await import("../../lib/session");
  return fn(m);
}

function normalizeSubject(input?: string) {
  const s = (input ?? "").trim();
  if (!s) return "";
  // 你现在用的是：英文/數學/其他（繁体/简体都可能出现）
  if (s === "英语") return "英文";
  if (s === "数学") return "數學";
  if (s === "其它") return "其他";
  return s;
}

export default function PracticeClient({
  subject,
  stage,
}: {
  subject?: string;
  stage?: string;
}) {
  const router = useRouter();

  const subj = useMemo(() => normalizeSubject(subject), [subject]);
  const stg = useMemo(() => (stage ?? "").trim(), [stage]);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AnySession[]>([]);

  async function refreshSessions() {
    const list = await withSessionLib((m) => {
      // 兼容不同命名：listSessions / 列出全部進度 / 讀取全部進度 等
      const fn =
        m.listSessions ||
        m.列出全部進度 ||
        m.讀取全部進度 ||
        m.getAllSessions ||
        m.取得全部進度;

      if (!fn) return [] as AnySession[];
      return fn();
    });
    setSessions(Array.isArray(list) ? list : []);
  }

  // 进入 /practice 时先加载列表
  useEffect(() => {
    refreshSessions();
  }, []);

// v2-5：同一 subject + stage 先复用旧进度，避免一直新增
useEffect(() => {
  if (!subj || !stg) return;

  const stageKey = (stg ?? "").trim().toUpperCase();

  (async () => {
    setLoading(true);
    setMsg(`正在檢查進度：${subj} / ${stageKey} ...`);

    try {
      const id = await withSessionLib((m) => {
        // 兼容不同命名
        const listFn =
          m.listSessions ||
          m.列出全部進度 ||
          m.讀取全部進度 ||
          m.getAllSessions ||
          m.取得全部進度;

        const setActive = m.設定目前進度id || m.setActiveSessionId || m.setCurrentSessionId;

        const create =
          m.新增進度 ||
          m.createSession ||
          m.newSession ||
          m.建立新進度 ||
          m.createNewSession;

        const write = m.寫入進度 || m.saveSession || m.writeSession;

        if (!listFn || !setActive || !write || !create) {
          throw new Error("lib/session 缺少必要函式（列出/設定目前id/寫入/新增）");
        }

        const all: AnySession[] = Array.isArray(listFn()) ? listFn() : [];

        // 找「同 subject + 同 stage」的既有进度
        // 规则：stage 可能没存过，所以要做大小写处理
        const found = all.find((s) => {
          const sSubj = String(s?.subject ?? "").trim();
          const sStage = String(s?.stage ?? "").trim().toUpperCase();
          return sSubj === subj && sStage === stageKey;
        });

        // ✅ 有旧进度：直接复用
        if (found?.id) {
          setActive(found.id);
          return found.id as string;
        }

        // ❌ 没有：新建一个
        const s: AnySession = create(subj);
        s.stage = stageKey;

        write(s);
        setActive(s.id);
        return s.id as string;
      });

      setMsg(`已進入：${subj} / ${stageKey}`);
      router.replace(`/practice/session?id=${encodeURIComponent(id)}`);
    } catch (e: any) {
      setMsg(`處理失敗：${e?.message ?? String(e)}`);
      setLoading(false);
    }
  })();
}, [subj, stg, router]);

  async function onContinue(id: string) {
    await withSessionLib((m) => {
      const setActive = m.設定目前進度id || m.setActiveSessionId || m.setCurrentSessionId;
      if (setActive) setActive(id);
    });
    router.replace(`/practice/session?id=${encodeURIComponent(id)}`);
  }

  async function onRemove(id: string) {
    await withSessionLib((m) => {
      const rm = m.刪除進度 || m.removeSession || m.deleteSession;
      if (rm) rm(id);
    });
    await refreshSessions();
  }

  async function onClearAll() {
    await withSessionLib((m) => {
      const clear = m.清除全部進度 || m.clearAllSessions || m.removeAllSessions;
      if (clear) clear();
    });
    await refreshSessions();
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 26 }}>學習區</div>
        <div style={{ opacity: 0.75, lineHeight: 1.8, marginTop: 8 }}>
          這裡只負責「繼續」：你可以同時有多個科目的進度，隨時切換繼續或清除。
        </div>

        <div style={{ height: 10 }} />

        <div style={row}>
          {subj && stg ? (
            <span style={pill}>入口參數：{subj} / {stg}</span>
          ) : (
            <span style={pill}>沒有入口參數（從英文專區點 A1/A2... 會自動帶入）</span>
          )}
          <button style={btn} onClick={() => router.replace("/")}>← 回首頁</button>
          <button style={btn} onClick={() => router.replace("/english")}>去 英文專區</button>
        </div>

        {msg ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "#f5f5f5" }}>
            {msg}
          </div>
        ) : null}
      </div>

      <div style={{ height: 12 }} />

      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
          目前未完成進度
        </div>

        {loading ? (
          <div style={{ opacity: 0.75, lineHeight: 1.8 }}>
            正在處理中…（如果你是從英文专区点进来，应该会自动跳到作答页）
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ opacity: 0.75, lineHeight: 1.8 }}>
            你可以從英文專區選 A1/A2… 進來，系統會自動建立一個進度並進入作答頁。
          </div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {sessions.map((s: AnySession) => (
              <div key={s.id} style={{ padding: 12, borderRadius: 14, border: "1px solid #eee" }}>
                <div style={{ ...row, justifyContent: "space-between" }}>
                  <div style={row}>
                    <span style={pill}>科目：{s.subject}</span>
                    <span style={pill}>階段：{s.stage ?? "-"}</span>
                    <span style={pill}>第 {Number(s.currentIndex ?? 0) + 1} 題</span>
                  </div>

                  <div style={row}>
  <button
    style={btnPrimary}
    onClick={() => onContinue(s.id)}
  >
    ▶ 繼續
  </button>
</div>
                </div>
              </div>
            ))}

            <div style={{ marginTop: 8 }}>
              <button style={btn} onClick={onClearAll}>清除全部進度</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}