// app/english/page.tsx
"use client";

import Link from "next/link";
import { useMemo } from "react";

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "16px 12px 28px",
};

const topRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 12,
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  fontWeight: 900,
  letterSpacing: 0.2,
};

const desc: React.CSSProperties = {
  margin: "6px 0 0",
  opacity: 0.75,
  lineHeight: 1.7,
};

const backBtn: React.CSSProperties = {
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
  gap: 12,
  marginTop: 14,
};

const gridMobile: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12,
  marginTop: 14,
};

const card: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid #e6e6e6",
  background: "#fff",
  padding: "14px 14px",
  textDecoration: "none",
  color: "#111",
};

const cardTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 18,
  fontWeight: 900,
};

const cardMeta: React.CSSProperties = {
  margin: "6px 0 0",
  opacity: 0.7,
  lineHeight: 1.6,
  fontSize: 13,
};

const small: React.CSSProperties = {
  marginTop: 10,
  fontSize: 13,
  opacity: 0.7,
};

type Stage = {
  id: string;
  label: string;
  sub: string;
  // 未来接学习页 / 选择阶段页
  href: string;
};

export default function EnglishPage() {
  const stages: Stage[] = useMemo(
    () => [
      { id: "a1", label: "A1", sub: "基礎入門", href: "/english/a1" },
      { id: "a2", label: "A2", sub: "加強基礎", href: "/english/a2" },
      { id: "b1", label: "B1", sub: "實用進階", href: "/english/b1" },
      { id: "b2", label: "B2", sub: "高階運用", href: "/english/b2" },
      { id: "c1", label: "C1", sub: "精準表達", href: "/english/c1" },
      { id: "c2", label: "C2", sub: "母語程度", href: "/english/c2" },
      { id: "applied", label: "英語應用能力", sub: "情境整合（非考試）", href: "/english/applied" },
    ],
    []
  );

  return (
    <main style={wrap}>
      <div style={topRow}>
        <div>
          <h1 style={title}>英文專區</h1>
          <p style={desc}>
            先把「階段入口」做穩，v2 只做 UI 與導航，不碰題庫/AI/判分。
          </p>
        </div>

        <Link href="/" style={backBtn}>
          ← 回首頁
        </Link>
      </div>

function ResponsiveGrid({ stages }: { stages: Stage[] }) {
  const isNarrow =
    typeof window !== "undefined"
      ? window.matchMedia("(max-width: 640px)").matches
      : false;

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

      {/* 英語應用能力：横向强调卡 */}
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
              <h2 style={{ ...cardTitle, fontSize: 20 }}>
                {appliedStage.label}
              </h2>
              <div style={{ ...cardMeta, fontSize: 14 }}>
                {appliedStage.sub}
              </div>
            </div>

            <div style={{ fontSize: 14, opacity: 0.8 }}>→</div>
          </Link>
        </div>
      )}
    </>
  );
}