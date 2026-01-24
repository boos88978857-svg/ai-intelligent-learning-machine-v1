// app/english/page.tsx
"use client";

import React from "react";
import Link from "next/link";

type Stage = {
  id: string;
  label: string;
  sub: string;
  href: string;
};

const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "18px 14px" };
const topRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 14,
  flexWrap: "wrap",
};
const title: React.CSSProperties = { fontSize: 34, fontWeight: 900, margin: 0 };
const desc: React.CSSProperties = { marginTop: 8, opacity: 0.7, lineHeight: 1.7 };
const backBtn: React.CSSProperties = {
  display: "inline-block",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  textDecoration: "none",
  color: "#111",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 14,
  marginTop: 16,
};
const gridMobile: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginTop: 16,
};

const card: React.CSSProperties = {
  padding: "16px 16px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
  textDecoration: "none",
  color: "#111",
};
const cardTitle: React.CSSProperties = { fontSize: 22, fontWeight: 900, margin: 0 };
const cardMeta: React.CSSProperties = { marginTop: 6, opacity: 0.75, lineHeight: 1.5 };
const small: React.CSSProperties = { marginTop: 10, opacity: 0.7 };

const stages: Stage[] = [
  { id: "a1", label: "A1", sub: "基礎入門", href: "/practice?subject=英文&stage=A1" },
  { id: "a2", label: "A2", sub: "加強基礎", href: "/practice?subject=英文&stage=A2" },
  { id: "b1", label: "B1", sub: "實用進階", href: "/practice?subject=英文&stage=B1" },
  { id: "b2", label: "B2", sub: "高階運用", href: "/practice?subject=英文&stage=B2" },
  { id: "c1", label: "C1", sub: "精準表達", href: "/practice?subject=英文&stage=C1" },
  { id: "c2", label: "C2", sub: "母語程度", href: "/practice?subject=英文&stage=C2" },

  // ✅ 这张我们要做成长条横向
  {
    id: "applied",
    label: "英語應用能力",
    sub: "情境整合（非考試）",
    href: "/practice?subject=英文&stage=A.T.E.M",
  },
];

export default function EnglishPage() {
  return (
    <main style={wrap}>
      <div style={topRow}>
        <div>
          <h1 style={title}>英文專區</h1>
          <p style={desc}>先把「階段入口」做穩，先不碰題庫/AI/判分。</p>
        </div>

        <Link href="/" style={backBtn}>
          ← 回首頁
        </Link>
      </div>

      <ResponsiveGrid stages={stages} />
    </main>
  );
}

function ResponsiveGrid({ stages }: { stages: Stage[] }) {
  const isNarrow =
    typeof window !== "undefined" ? window.matchMedia("(max-width: 640px)").matches : false;

  const normalStages = stages.filter((s) => s.id !== "applied");
  const appliedStage = stages.find((s) => s.id === "applied");

  return (
    <>
      {/* 一般阶段卡 */}
      <div style={isNarrow ? gridMobile : grid}>
        {normalStages.map((s) => (
          <Link key={s.id} href={s.href} style={card}>
            <h2 style={cardTitle}>{s.label}</h2>
            <div style={cardMeta}>{s.sub}</div>
            <div style={small}>點擊進入 →</div>
          </Link>
        ))}
      </div>

      {/* ✅ 英語應用能力：横向长条强调卡 */}
      {appliedStage && (
        <div style={{ marginTop: 14 }}>
          <Link
            href={appliedStage.href}
            style={{
              ...card,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 18px",
              border: "1px dashed #ccc",
            }}
          >
            <div>
              <h2 style={{ ...cardTitle, fontSize: 20 }}>{appliedStage.label}</h2>
              <div style={{ ...cardMeta, fontSize: 14 }}>{appliedStage.sub}</div>
            </div>

            <div style={{ fontSize: 16, opacity: 0.8 }}>→</div>
          </Link>
        </div>
      )}
    </>
  );
}