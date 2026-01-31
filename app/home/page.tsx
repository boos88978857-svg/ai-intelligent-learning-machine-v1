// app/home/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";

const wrap: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "18px 14px",
};

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  marginBottom: 12,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const card: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  background: "#fff",
  padding: 14,
  cursor: "pointer",
};

const cardTitle: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 6,
};

const desc: React.CSSProperties = {
  opacity: 0.7,
  fontSize: 13,
  lineHeight: 1.5,
};

export default function HomePage() {
  const router = useRouter();

  return (
    <main style={wrap}>
      <div style={title}>🏠 首页</div>

      <div style={grid}>
        <div style={card} onClick={() => router.push("/practice")}>
          <div style={cardTitle}>📘 学习区</div>
          <div style={desc}>进入练习、阶段、回合。</div>
        </div>

        <div style={card} onClick={() => router.push("/practice/wrong")}>
          <div style={cardTitle}>📕 错题本</div>
          <div style={desc}>按科目/阶段整理错题，随时重练。</div>
        </div>

        <div style={card} onClick={() => router.push("/settings")}>
          <div style={cardTitle}>⚙️ 设定</div>
          <div style={desc}>更改母语/学习语言等。</div>
        </div>
      </div>
    </main>
  );
}