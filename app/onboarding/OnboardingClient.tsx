// app/onboarding/OnboardingClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  LOCALE_OPTIONS,
  getLangConfig,
  setLangConfig,
  getLocaleLabelWithFlag,
  type LocaleCode,
} from "../../lib/lang-config";

import LanguagePickerSheet from "../components/LanguagePickerSheet";

const wrap: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "18px 14px" };

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6e6e6",
  borderRadius: 18,
  padding: 16,
};

const title: React.CSSProperties = { fontSize: 30, fontWeight: 900, marginBottom: 10 };

const sub: React.CSSProperties = { opacity: 0.75, fontSize: 13, lineHeight: 1.6, marginBottom: 14 };

const field: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: "14px 14px",
  background: "#fafafa",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  cursor: "pointer",
  userSelect: "none",
};

const fieldLabel: React.CSSProperties = { fontWeight: 900, marginBottom: 8 };

const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  fontSize: 12,
  opacity: 0.9,
};

const btnPrimary: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};

export default function OnboardingClient() {
  const router = useRouter();

  const saved = useMemo(() => getLangConfig(), []);
  const [native, setNative] = useState<LocaleCode>(saved.native);
  const [learning, setLearning] = useState<LocaleCode>(saved.learning);

  const [openType, setOpenType] = useState<null | "native" | "learning">(null);

  function confirm() {
    setLangConfig({ native, learning });
    router.replace("/home");
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>开始前先选语言</div>
        <div style={sub}>母语用于解释与提示；学习语言用于题库与课程入口。之后可在「设定」随时更改。</div>

        <div style={{ marginTop: 12 }}>
          <div style={fieldLabel}>母语</div>
          <div style={field} onClick={() => setOpenType("native")}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{getLocaleLabelWithFlag(native)}</div>
            <div style={{ opacity: 0.6 }}>点我选择</div>
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div>
          <div style={fieldLabel}>学习语言</div>
          <div style={field} onClick={() => setOpenType("learning")}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{getLocaleLabelWithFlag(learning)}</div>
            <div style={{ opacity: 0.6 }}>点我选择</div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>母语：{getLocaleLabelWithFlag(native)}</span>
            <span style={pill}>学习：{getLocaleLabelWithFlag(learning)}</span>
          </div>

          <button style={btnPrimary} onClick={confirm}>
            下一步 →
          </button>
        </div>
      </div>

      {/* 半屏滚轮 */}
      <LanguagePickerSheet
        open={openType === "native"}
        title="请选择母语"
        value={native}
        options={LOCALE_OPTIONS}
        onClose={() => setOpenType(null)}
        onConfirm={(v) => {
          setNative(v);
          setOpenType(null);
        }}
      />

      <LanguagePickerSheet
        open={openType === "learning"}
        title="请选择学习语言"
        value={learning}
        options={LOCALE_OPTIONS}
        onClose={() => setOpenType(null)}
        onConfirm={(v) => {
          setLearning(v);
          setOpenType(null);
        }}
      />
    </main>
  );
}