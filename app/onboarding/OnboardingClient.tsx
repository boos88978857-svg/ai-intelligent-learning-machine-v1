// app/onboarding/OnboardingClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import LanguagePickerSheet from "../components/LanguagePickerSheet";

import {
  LOCALE_OPTIONS,
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
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

export default function OnboardingClient() {
  const router = useRouter();

  // ✅ 如果曾经选过：可选择“沿用已保存”，但画面仍不预选（你要的）
  const saved = useMemo(() => (hasLangConfig() ? getLangConfig() : null), []);

  const [openType, setOpenType] = useState<"native" | "learning" | null>(null);

// ✅ UI 仍然不预选：保持 null
const [native, setNative] = useState<LocaleCode | null>(null);
const [learning, setLearning] = useState<LocaleCode | null>(null);

// ✅ 给「半屏选择器」用的 fallback（只用于打开时定位滚轮，不会显示在 UI 文案）
const fallbackNative = (saved?.native ?? LOCALE_OPTIONS[0].code) as LocaleCode;
const fallbackLearning = (saved?.learning ?? LOCALE_OPTIONS[0].code) as LocaleCode;

// 用额外 flag 控制「用户有没有真的选过」
const [nativeChosen, setNativeChosen] = useState(false);
const [learningChosen, setLearningChosen] = useState(false);

  const canEnter = !!native && !!learning;

  function enterHome() {
    if (!native || !learning) return;
    setLangConfig({ native, learning });
    router.replace("/home");
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>选择语言</div>
        <div style={sub}>
          先选择<strong>母语</strong>，再选择<strong>学习语言</strong>。  
          以后可在「设定」里随时更改。
        </div>

        {/* 母语 */}
        <div style={{ marginBottom: 12 }}>
          <div style={fieldLabel}>母语</div>
          <div style={field} onClick={() => setOpenType("native")}>
            <div style={{ fontWeight: 900 }}>
              {nativeChosen ? getLocaleLabelWithFlags(native ?? fallbackNative) : "请选择您的母语"}
            </div>
            <div style={hint}>点此选择</div>
          </div>
        </div>

        {/* 学习语言 */}
        <div>
          <div style={fieldLabel}>学习语言</div>
          <div style={field} onClick={() => setOpenType("learning")}>
            <div style={{ fontWeight: 900 }}>
              {learningChosen ? getLocaleLabelWithFlags(learning ?? fallbackLearning) : "请选择您要学习的语言"}
            </div>
            <div style={hint}>点此选择</div>
          </div>
        </div>

        {/* 按钮 */}
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
            进入首页 →
          </button>
        </div>
      </div>

      {/* ===== 半屏选择器 ===== */}
      <LanguagePickerSheet
        open={openType === "native"}
        title="选择母语"
        value={native ?? fallbackNative}
        onClose={() => setOpenType(null)}
        onConfirm={(v) => {
  setNative(v);
  setNativeChosen(true); // ✅ 就是这一行
  setOpenType(null);
}}
      />

      <LanguagePickerSheet
        open={openType === "learning"}
        title="选择学习语言"
        value={learning ?? fallbackLearning}
        onClose={() => setOpenType(null)}
        onConfirm={(v) => {
  setLearning(v);
  setLearningChosen(true); // ✅ 就是这一行
  setOpenType(null);
}}
      />
    </main>
  );
}