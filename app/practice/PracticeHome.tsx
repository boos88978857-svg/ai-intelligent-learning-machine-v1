// app/practice/PracticeHome.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getLangConfig, getLocaleLabel } from "../../lib/lang-config";

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "16px 14px",
};

const card: React.CSSProperties = {
  padding: "14px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const title: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  marginBottom: 10,
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
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 12,
  whiteSpace: "nowrap",
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

type LangState = { native: string; learning: string } | null;

export default function PracticeHome() {
  const router = useRouter();
  const [lang, setLang] = useState<LangState>(null);

  // ✅ 关键：只在浏览器读取 localStorage（避免 prerender/build 炸掉）
  useEffect(() => {
    const cfg = getLangConfig();
    setLang(cfg);
  }, []);

  // ✅ 没选语言 -> 导去 onboarding
  useEffect(() => {
    if (!lang) return; // 还没读到
    if (!lang.native || !lang.learning) {
      router.replace("/onboarding");
    }
  }, [lang, router]);

  // ✅ 还没读到配置前，不渲染（避免闪烁/误判）
  if (!lang) return null;

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={row}>
          <div>
            <div style={title}>学习首页</div>
            <div style={{ opacity: 0.75, fontSize: 13, lineHeight: 1.6 }}>
              这里是你选完语言后的入口页（后续你要改成更精致的卡片/关卡入口都从这里扩展）。
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>母语：{getLocaleLabel(lang.native as any) || lang.native}</span>
            <span style={pill}>学习：{getLocaleLabel(lang.learning as any) || lang.learning}</span>
            <button style={btn} onClick={() => router.push("/onboarding")}>
              更改语言
            </button>
          </div>
        </div>

        <div style={{ height: 12 }} />

        {/* ✅ 先给你最基础入口（后续你要换成卡片、分 Level 0/1/2 都从这里改） */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={btnPrimary} onClick={() => router.push("/practice")}>
            进入练习区 →
          </button>

          <button style={btn} onClick={() => router.push("/practice/wrong")}>
            错题本
          </button>
        </div>
      </div>
    </main>
  );
}