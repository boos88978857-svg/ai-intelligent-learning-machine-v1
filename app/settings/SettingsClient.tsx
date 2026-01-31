// app/settings/SettingsClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  LOCALE_OPTIONS,
  getLangConfig,
  setLangConfig,
  clearLangConfig,
  getLocaleLabelWithFlag,
  type LocaleCode,
} from "../../lib/lang-config";

import LanguagePickerSheet from "../components/LanguagePickerSheet";

const wrap: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "18px 14px" };
const card: React.CSSProperties = { background: "#fff", border: "1px solid #e6e6e6", borderRadius: 18, padding: 16 };
const title: React.CSSProperties = { fontSize: 26, fontWeight: 900, marginBottom: 10 };
const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };
const btn: React.CSSProperties = { padding: "10px 12px", borderRadius: 12, border: "1px solid #ddd", background: "#fff", cursor: "pointer" };
const btnPrimary: React.CSSProperties = { ...btn, border: "1px solid #111", background: "#111", color: "#fff" };

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

export default function SettingsClient() {
  const router = useRouter();

  const saved = useMemo(() => getLangConfig(), []);
  const [native, setNative] = useState<LocaleCode>(saved.native);
  const [learning, setLearning] = useState<LocaleCode>(saved.learning);

  const [openType, setOpenType] = useState<null | "native" | "learning">(null);

  function save() {
    setLangConfig({ native, learning });
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>设定</div>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>母语</div>
          <div style={field} onClick={() => setOpenType("native")}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{getLocaleLabelWithFlag(native)}</div>
            <div style={{ opacity: 0.6 }}>点我更改</div>
          </div>
        </div>

        <div style={{ height: 14 }} />

        <div>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>学习语言</div>
          <div style={field} onClick={() => setOpenType("learning")}>
            <div style={{ fontSize: 18, fontWeight: 800 }}>{getLocaleLabelWithFlag(learning)}</div>
            <div style={{ opacity: 0.6 }}>点我更改</div>
          </div>
        </div>

        <div style={{ height: 16 }} />

        <div style={row}>
          <button
            style={btnPrimary}
            onClick={() => {
              save();
              router.replace("/home");
            }}
          >
            保存并回首页
          </button>

          <button
            style={btn}
            onClick={() => {
              clearLangConfig();
              router.replace("/onboarding");
            }}
          >
            清除语言选择（回到引导）
          </button>
        </div>
      </div>

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

      <LanguagePickerSheet
        open={openType === "learning"}
        title="更改学习语言"
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