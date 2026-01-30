// app/onboarding/OnboardingClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LOCALE_OPTIONS,
  getLangConfig,
  getLocaleLabel,
  setLangConfig,
  type LocaleCode,
} from "../../lib/lang-config";

const wrap: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "18px 14px" };

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6e6e6",
  borderRadius: 18,
  padding: 16,
};

const title: React.CSSProperties = { fontSize: 26, fontWeight: 900, marginBottom: 10 };

const sub: React.CSSProperties = { opacity: 0.75, fontSize: 13, lineHeight: 1.6, marginBottom: 14 };

const sectionTitle: React.CSSProperties = { fontWeight: 900, margin: "14px 0 10px" };

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
};

const optBtnBase: React.CSSProperties = {
  borderRadius: 14,
  border: "1px solid #e6e6e6",
  background: "#fff",
  padding: "12px 12px",
  textAlign: "left",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const badge: React.CSSProperties = {
  fontSize: 12,
  borderRadius: 999,
  padding: "3px 8px",
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  whiteSpace: "nowrap",
};

const footer: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "space-between",
};

const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  fontSize: 12,
  opacity: 0.9,
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = { ...btn, border: "1px solid #111", background: "#111", color: "#fff" };

function OptionButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      style={{
        ...optBtnBase,
        border: active ? "1px solid #111" : "1px solid #e6e6e6",
        boxShadow: active ? "0 6px 18px rgba(0,0,0,0.08)" : "none",
      }}
      onClick={onClick}
    >
      <span style={{ fontWeight: active ? 900 : 700 }}>{label}</span>
      <span style={{ ...badge, opacity: active ? 1 : 0.6 }}>{active ? "已選" : "選擇"}</span>
    </button>
  );
}

export default function OnboardingClient() {
  const router = useRouter();

  const saved = useMemo(() => getLangConfig(), []);
  const [native, setNative] = useState<LocaleCode>(saved.native);
  const [learning, setLearning] = useState<LocaleCode>(saved.learning);

  // ✅ 如果已经选过语言，直接去 /home（避免重复 onboarding）
  useEffect(() => {
    const cfg = getLangConfig();
    if (cfg.hasChosen) router.replace("/home");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 学习语言不允许跟母语一样（自动跳到下一个）
  useEffect(() => {
    if (learning !== native) return;
    const next = LOCALE_OPTIONS.find((x) => x.code !== native)?.code;
    if (next) setLearning(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  function onConfirm() {
    setLangConfig({ native, learning });
    router.replace("/home");
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>开始前先选语言</div>
        <div style={sub}>
          你可以之后在<strong>设定</strong>里随时修改。现在先选：<strong>母语</strong> 与 <strong>学习语言</strong>。
        </div>

        <div style={sectionTitle}>① 选择母语（界面语言）</div>
        <div style={grid}>
          {LOCALE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.code}
              active={opt.code === native}
              label={opt.label}
              onClick={() => setNative(opt.code)}
            />
          ))}
        </div>

        <div style={sectionTitle}>② 选择学习语言</div>
        <div style={grid}>
          {LOCALE_OPTIONS.map((opt) => (
            <OptionButton
              key={opt.code}
              active={opt.code === learning}
              label={opt.label}
              onClick={() => setLearning(opt.code)}
            />
          ))}
        </div>

        <div style={footer}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>母语：{getLocaleLabel(native)}</span>
            <span style={pill}>学习：{getLocaleLabel(learning)}</span>
          </div>

          <button style={btnPrimary} onClick={onConfirm}>
            进入首页 →
          </button>
        </div>
      </div>
    </main>
  );
}