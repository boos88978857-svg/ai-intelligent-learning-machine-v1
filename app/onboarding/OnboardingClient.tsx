// app/onboarding/OnboardingClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import LanguagePickerSheet from "../components/LanguagePickerSheet";

import {
  hasLangConfig,
  getLangConfig,
  setLangConfig,
  getLocaleLabelWithFlags,
  type LocaleCode,
} from "../../lib/lang-config";

const wrap: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "18px 14px",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6e6e6",
  borderRadius: 18,
  padding: 16,
};

const title: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  marginBottom: 8,
};

const sub: React.CSSProperties = {
  opacity: 0.75,
  fontSize: 13,
  lineHeight: 1.6,
  marginBottom: 14,
};

const field: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 14,
  padding: "12px 12px",
  background: "#fafafa",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

const fieldLabel: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 8,
};

const hint: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.65,
};

const btnRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 14,
};

const btn: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

export default function OnboardingClient() {
  const router = useRouter();

  const saved = useMemo(() => (hasLangConfig() ? getLangConfig() : null), []);

  const [openType, setOpenType] = useState<"native" | "learning" | null>(null);
  const [native, setNative] = useState<LocaleCode | null>(null);
  const [learning, setLearning] = useState<LocaleCode | null>(null);

  const canEnter = !!native && !!learning;

  function enterHome() {
    if (!native || !learning) return;
    setLangConfig({ native, learning });
    router.replace("/home");
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>开始前先选语言</div>
        <div style={sub}>
          母语用于解释与提示；学习语言用于题库与课程入口。之后可在「设定」随时更改。
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={fieldLabel}>母语</div>
          <div style={field} onClick={() => setOpenType("native")}>
            <div style={{ fontWeight: 900 }}>
              {native ? getLocaleLabelWithFlags(native) : "请选择您的母语"}
            </div>
            <div style={hint}>点我选择</div>
          </div>
        </div>

        <div>
          <div style={fieldLabel}>学习语言</div>
          <div style={field} onClick={() => setOpenType("learning")}>
            <div style={{ fontWeight: 900 }}>
              {learning ? getLocaleLabelWithFlags(learning) : "请选择您要学习的语言"}
            </div>
            <div style={hint}>点我选择</div>
          </div>
        </div>

        <div style={btnRow}>
          <button
            style={btn}
            onClick={() => {
              if (!saved) return;
              setNative(saved.native);
              setLearning(saved.learning);
            }}
            disabled={!saved}
          >
            沿用已保存
          </button>

          <button
            style={{
              ...btnPrimary,
              opacity: canEnter ? 1 : 0.45,
              cursor: canEnter ? "pointer" : "not-allowed",
            }}
            onClick={enterHome}
            disabled={!canEnter}
          >
            下一步 →
          </button>
        </div>
      </div>

      <LanguagePickerSheet
        open={openType === "native"}
        title="请选择母语"
        value={native}
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
        onClose={() => setOpenType(null)}
        onConfirm={(v) => {
          setLearning(v);
          setOpenType(null);
        }}
      />
    </main>
  );
}