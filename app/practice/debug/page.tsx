"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const wrap: React.CSSProperties = { maxWidth: 900, margin: "0 auto", padding: 16 };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e6e6e6", borderRadius: 14, padding: 14 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};
const btnPrimary: React.CSSProperties = { ...btn, background: "#111", color: "#fff", border: "1px solid #111" };

export default function DebugPage() {
  const router = useRouter();
  const [msg, setMsg] = useState<string>("");

  async function withSessionLib<T>(fn: (m: any) => Promise<T> | T) {
    const m: any = await import("../../../lib/session");
    return fn(m);
  }

  async function make(subjectLabel: string) {
    try {
      const id = await withSessionLib(async (m) => {
        // 兼容不同命名：newSession / createSession / 建立新進度（如果你后来真有加也行）
        const creator =
          m.newSession || m.createSession || m["建立新進度"] || m["建立新進度"] || null;

        if (!creator) {
          throw new Error("lib/session 找不到 newSession / createSession / 建立新進度 任何一个函数");
        }

        const s = creator(subjectLabel as any);
        // 兼容写入：upsertSession / saveSession / 寫入進度
        const upsert = m.upsertSession || m.saveSession || m["寫入進度"] || null;
        if (!upsert) throw new Error("lib/session 找不到 upsertSession / saveSession / 寫入進度");

        upsert(s);

        // 兼容 active id：setActiveSessionId / 設定目前進度id
        const setActive = m.setActiveSessionId || m["設定目前進度id"] || m["設定目前進度id"] || null;
        if (setActive) setActive(s.id);

        return s.id as string;
      });

      setMsg(`✅ 已建立 ${subjectLabel} 進度：${id}（现在去 /practice 看是否出现「继续」）`);
    } catch (e: any) {
      setMsg(`❌ 建立失败：${e?.message || String(e)}`);
    }
  }

  async function clearAll() {
    try {
      await withSessionLib(async (m) => {
        const clearer = m.clearAllSessions || m["清除全部進度"] || null;
        if (!clearer) throw new Error("lib/session 找不到 clearAllSessions / 清除全部進度");
        clearer();
      });
      setMsg("✅ 已清除全部進度");
    } catch (e: any) {
      setMsg(`❌ 清除失败：${e?.message || String(e)}`);
    }
  }

  return (
    <main style={wrap}>
      <h2 style={{ margin: "8px 0 12px" }}>Debug / 建立測試進度</h2>

      <div style={{ ...card, marginBottom: 12 }}>
        <div style={row}>
          <button style={btnPrimary} onClick={() => make("英文")}>建立 英文 進度</button>
          <button style={btnPrimary} onClick={() => make("數學")}>建立 數學 進度</button>
          <button style={btnPrimary} onClick={() => make("其他")}>建立 其他 進度</button>
          <button style={btn} onClick={clearAll}>清除全部進度</button>
          <button style={btn} onClick={() => router.push("/practice")}>回到 /practice</button>
        </div>

        <div style={{ marginTop: 12, opacity: 0.8, lineHeight: 1.6 }}>
          说明：这个页面使用「动态 import」避免因 export 名称不一致导致编译失败。  
          如果你不需要 debug 页面，也可以直接把整个 `app/practice/debug` 文件夹删掉（更干净）。
        </div>
      </div>

      {msg ? (
        <div style={{ ...card, background: "#f7f7f7" }}>
          <div style={{ whiteSpace: "pre-wrap" }}>{msg}</div>
        </div>
      ) : null}
    </main>
  );
}