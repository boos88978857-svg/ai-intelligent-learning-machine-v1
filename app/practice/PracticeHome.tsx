"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getLangConfig,
  getLocaleLabel,
} from "../../lib/lang-config";

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "18px 14px",
};

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  marginBottom: 6,
};

const sub: React.CSSProperties = {
  opacity: 0.7,
  marginBottom: 18,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
};

const card: React.CSSProperties = {
  borderRadius: 18,
  border: "1px solid #e6e6e6",
  background: "#fff",
  padding: 16,
  cursor: "pointer",
  transition: "transform .12s ease, box-shadow .12s ease",
};

const cardHover: React.CSSProperties = {
  transform: "translateY(-2px)",
  boxShadow: "0 8px 18px rgba(0,0,0,.06)",
};

const badge: React.CSSProperties = {
  display: "inline-block",
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid #eee",
  fontSize: 12,
  marginBottom: 8,
};

export default function PracticeHome() {
  const router = useRouter();
  const lang = useMemo(() => getLangConfig(), []);

  // ✅ 没选语言就强制回 Onboarding
  useEffect(() => {
    if (!lang?.native || !lang?.learning) {
      router.replace("/onboarding");
    }
  }, [lang, router]);

  const nativeLabel = getLocaleLabel(lang.native);
  const learningLabel = getLocaleLabel(lang.learning);

  return (
    <main style={wrap}>
      <div>
        <div style={title}>学习首页</div>
        <div style={sub}>
          {nativeLabel} → {learningLabel}
        </div>
      </div>

      <div style={grid}>
        <HomeCard
          title="📘 学习课程"
          desc="从 0 基础到进阶，系统化学习"
          onClick={() => router.push("/practice/learning")}
        />

        <HomeCard
          title="📕 错题重练"
          desc="专练你不会的内容"
          onClick={() => router.push("/practice/wrong")}
        />

        <HomeCard
          title="🤖 AI 对话（即将）"
          desc="没有真人时，由 AI 陪你练"
          disabled
        />

        <HomeCard
          title="🌍 即时翻译（即将）"
          desc="旅游、对话即时翻译"
          disabled
        />
      </div>
    </main>
  );
}

/* ================= 小组件 ================= */

function HomeCard({
  title,
  desc,
  onClick,
  disabled,
}: {
  title: string;
  desc: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = React.useState(false);

  return (
    <div
      style={{
        ...card,
        ...(hover && !disabled ? cardHover : {}),
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => !disabled && onClick?.()}
    >
      {disabled ? <span style={badge}>即将开放</span> : null}
      <div style={{ fontSize: 20, fontWeight: 900, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ opacity: 0.75, fontSize: 13 }}>{desc}</div>
    </div>
  );
}