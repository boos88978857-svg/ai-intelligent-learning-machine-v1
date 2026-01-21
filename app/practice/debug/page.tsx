"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  建立新進度,
  寫入進度,
  設定目前進度id,
  清除全部進度,
  科目
} from "../../../lib/session";

const wrap: React.CSSProperties = {
  maxWidth: 900,
  margin: "0 auto",
  padding: "12px 0"
};

const card: React.CSSProperties = {
  padding: "18px 16px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6"
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e5e5e5",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  color: "#111"
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#111",
  borderColor: "#111",
  color: "#fff"
};

export default function PracticeDebugPage() {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  function make(subject: 科目) {
    const s = 建立新進度(subject, 20, 5);
    寫入進度(s);
    設定目前進度id(s.id);
    setMsg(`已建立「${subject}」測試進度：可回學習區看到未完成列表，或直接進入作答頁。`);
  }

  function goPractice() {
    router.push("/practice");
  }

  function goSession() {
    router.push("/practice/session");
  }

  function clearAll() {
    清除全部進度();
    setMsg("已清除所有進度。");
  }

  return (
    <main style={wrap}>
      <h1 style={{ fontSize: 22, fontWeight: 900, margin: "0 0 10px" }}>
        Debug（建立測試進度）
      </h1>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={card}>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={() => make("英文")} style={btnPrimary}>
              建立 英文 進度
            </button>
            <button onClick={() => make("數學")} style={btnPrimary}>
              建立 數學 進度
            </button>
            <button onClick={() => make("其他學科")} style={btnPrimary}>
              建立 其他學科 進度
            </button>
            <button onClick={clearAll} style={btn}>
              清除全部進度
            </button>
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={goPractice} style={btn}>
              前往學習區（續做中心）
            </button>
            <button onClick={goSession} style={btn}>
              直接進作答頁（使用目前進度）
            </button>
            <button onClick={() => router.back()} style={btn}>
              ← 回上一頁
            </button>
          </div>

          {msg ? (
            <div style={{ marginTop: 12, fontWeight: 900, opacity: 0.85 }}>
              {msg}
            </div>
          ) : (
            <div style={{ marginTop: 12, opacity: 0.75, lineHeight: 1.7 }}>
              ※ 先點上面任一科目建立進度，再回學習區查看未完成列表。
            </div>
          )}
        </div>
      </div>
    </main>
  );
}