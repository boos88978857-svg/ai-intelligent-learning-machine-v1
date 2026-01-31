// app/settings/SettingsClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import LanguagePickerSheet from "../components/LanguagePickerSheet";

import {
  getLangConfig,
  setLangConfig,
  clearLangConfig,
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

const fieldLabel: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 8,
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

const hint: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.65,
};

const btnRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  marginTop: 14,
  flexWrap: "wrap",
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

export default function SettingsClient() {
  const router = useRouter();

  const saved = useMemo(() => getLangConfig(), []);
  const [native, setNative] = useState<LocaleCode>(saved.native);
  const [learning, setLearning] = useState<LocaleCode>(saved.learning);

  const [openType, setOpenType] = useState<"native" | "learning" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 1200);
    return () => window.clearTimeout(t);
  }, [toast]);

  function onSave() {
    setLangConfig({ native, learning });
    setToast("已保存 ✅");
  }

  function onResetAll() {
    clearLangConfig();
    setToast("已清除，回到选择语言");
    window.setTimeout(() => {
      router.replace("/onboarding");
    }, 600);
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>设定</div>
        <div style={sub}>可随时修改母语与学习语言。</div>

        {/* 母语 */}
        <div style={{ marginBottom: 12 }}>
          <div style={fieldLabel}>母语</div>
          <div style={field} onClick={() => setOpenType("native")}>
            <div style={{ fontWeight: 900 }}>
              {native ? getLocaleLabelWithFlags(native) : "请选择您的母语"}
            </div>
            <div style={hint}>点此更改</div>
          </div>
        </div>

        {/* 学习语言 */}
        <div>
          <div style={fieldLabel}>学习语言</div>
          <div style={field} onClick={() => setOpenType("learning")}>
            <div style={{ fontWeight: 900 }}>
              {learning ? getLocaleLabelWithFlags(learning) : "请选择您要学习的语言"}
            </div>
            <div style={hint}>点此更改</div>
          </div>
        </div>

        <div style={btnRow}>
          <button style={btnPrimary} onClick={onSave}>
            保存
          </button>

          <button style={btn} onClick={onResetAll}>
            清除语言并回到选择页
          </button>
        </div>

        {toast ? (
          <div style={{ marginTop: 12, opacity: 0.75, fontSize: 13 }}>{toast}</div>
        ) : null}
      </div>

      {/* 半屏选择器：母语 */}
      <LanguagePickerSheet
        open={openType === "native"}
        title="更改母语"
        value={native}
        onClose={() => setOpenType(null)}
        onConfirm={(v) => {
          setNative(v);
          setOpenType(null);
        }}
      />

      {/* 半屏选择器：学习语言 */}
      <LanguagePickerSheet
        open={openType === "learning"}
        title="更改学习语言"
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