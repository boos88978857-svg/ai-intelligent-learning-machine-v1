// app/onboarding/OnboardingClient.tsx
"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  LOCALE_OPTIONS,
  getLangConfig,
  getLocaleLabel,
  setLangConfig,
  type LocaleCode,
} from "../../lib/lang-config";

/** ========== styles ========== */
const wrap: React.CSSProperties = {
  maxWidth: 760,
  margin: "0 auto",
  padding: "18px 14px",
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6e6e6",
  borderRadius: 18,
  padding: 16,
};

const h1: React.CSSProperties = { fontSize: 28, fontWeight: 900, margin: "0 0 8px" };
const p: React.CSSProperties = { opacity: 0.75, lineHeight: 1.6, margin: "0 0 14px" };

const fieldLabel: React.CSSProperties = { fontWeight: 900, margin: "14px 0 8px" };

const selectRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  padding: "14px 14px",
  background: "#fafafa",
  cursor: "pointer",
};

const selectLeft: React.CSSProperties = { display: "flex", gap: 10, alignItems: "center" };

const placeholderText: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  opacity: 0.45,
};

const valueText: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 900,
};

const hintText: React.CSSProperties = { opacity: 0.55, fontWeight: 700 };

const footer: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "space-between",
};

const pill: React.CSSProperties = {
  padding: "7px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  fontSize: 12,
  opacity: 0.9,
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  cursor: "pointer",
};

const btnDisabled: React.CSSProperties = {
  ...btnPrimary,
  opacity: 0.35,
  cursor: "not-allowed",
};

/** ===== BottomSheet wheel ===== */
const sheetMask: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-end",
  zIndex: 9999,
};

const sheet: React.CSSProperties = {
  width: "100%",
  maxWidth: 760,
  background: "#fff",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  border: "1px solid rgba(0,0,0,0.08)",
  overflow: "hidden",
};

const sheetHead: React.CSSProperties = {
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  borderBottom: "1px solid #eee",
};

const sheetTitle: React.CSSProperties = { fontWeight: 900 };

const sheetBtns: React.CSSProperties = { display: "flex", gap: 10 };

const btn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 12,
  border: "1px solid #e5e5e5",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};

const btnOk: React.CSSProperties = {
  ...btn,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

const wheelWrap: React.CSSProperties = {
  position: "relative",
  height: 300,
  background: "#fafafa",
};

const wheel: React.CSSProperties = {
  height: "100%",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "y mandatory",
  padding: "110px 0", // ✅ 上下留白，保证能选到最底
};

const wheelItemBase: React.CSSProperties = {
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  scrollSnapAlign: "center",
  fontSize: 18,
  userSelect: "none",
};

const centerMask: React.CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  left: 0,
  right: 0,
  top: "50%",
  transform: "translateY(-50%)",
  height: 44,
  borderTop: "1px solid rgba(0,0,0,0.10)",
  borderBottom: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.35)",
};

/** ========== component ========== */
type PickerKind = "native" | "learning";

export default function OnboardingClient() {
  const router = useRouter();
  const saved = useMemo(() => getLangConfig(), []);

  const [native, setNative] = useState<LocaleCode | null>(saved.native);
  const [learning, setLearning] = useState<LocaleCode | null>(saved.learning);

  const [open, setOpen] = useState<PickerKind | null>(null);
  const [temp, setTemp] = useState<LocaleCode | null>(null);

  const canNext = !!native && !!learning;

  function openPicker(kind: PickerKind) {
    setOpen(kind);
    const current = kind === "native" ? native : learning;
    setTemp(current ?? LOCALE_OPTIONS[0].code);
  }

  function closePicker() {
    setOpen(null);
    setTemp(null);
  }

  function confirmPicker() {
    if (!open || !temp) return;
    if (open === "native") setNative(temp);
    if (open === "learning") setLearning(temp);
    closePicker();
  }

  function onNext() {
    if (!canNext) return;
    setLangConfig({ native, learning });
    router.replace("/home");
  }

  const titleText = open === "native" ? "请选择母语" : "请选择学习语言";

  return (
    <main style={wrap}>
      <div style={card}>
        <h1 style={h1}>开始前先选语言</h1>
        <p style={p}>母语用于解释与提示；学习语言用于题库与课程入口。之后可在「设定」随时更改。</p>

        <div style={fieldLabel}>母语</div>
        <div style={selectRow} onClick={() => openPicker("native")}>
          <div style={selectLeft}>
            <div style={native ? valueText : placeholderText}>
              {native ? getLocaleLabel(native) : "请选择您的母语"}
            </div>
          </div>
          <div style={hintText}>点我选择</div>
        </div>

        <div style={fieldLabel}>学习语言</div>
        <div style={selectRow} onClick={() => openPicker("learning")}>
          <div style={selectLeft}>
            <div style={learning ? valueText : placeholderText}>
              {learning ? getLocaleLabel(learning) : "请选择您学习语言"}
            </div>
          </div>
          <div style={hintText}>点我选择</div>
        </div>

        <div style={footer}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>母语：{native ? getLocaleLabel(native) : "未选择"}</span>
            <span style={pill}>学习：{learning ? getLocaleLabel(learning) : "未选择"}</span>
          </div>

          <button style={canNext ? btnPrimary : btnDisabled} onClick={onNext}>
            下一步 →
          </button>
        </div>
      </div>

      {/* ===== BottomSheet picker ===== */}
      {open && (
        <div style={sheetMask} onClick={closePicker}>
          <div style={sheet} onClick={(e) => e.stopPropagation()}>
            <div style={sheetHead}>
              <div style={sheetTitle}>{titleText}</div>
              <div style={sheetBtns}>
                <button style={btn} onClick={closePicker}>
                  取消
                </button>
                <button style={btnOk} onClick={confirmPicker}>
                  确定
                </button>
              </div>
            </div>

            <div style={wheelWrap}>
              <div
                style={wheel}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const idx = Math.round((el.scrollTop) / 44);
                  const clamped = Math.max(0, Math.min(LOCALE_OPTIONS.length - 1, idx));
                  setTemp(LOCALE_OPTIONS[clamped].code);
                }}
                ref={(el) => {
                  if (!el || !temp) return;
                  // 初次打开对齐到当前项
                  const idx = LOCALE_OPTIONS.findIndex((x) => x.code === temp);
                  if (idx >= 0) el.scrollTop = idx * 44;
                }}
              >
                {LOCALE_OPTIONS.map((opt) => {
                  const active = opt.code === temp;
                  return (
                    <div
                      key={opt.code}
                      style={{
                        ...wheelItemBase,
                        fontWeight: active ? 900 : 650,
                        opacity: active ? 1 : 0.68, // ✅ 不要 blur，iOS 才不会糊
                      }}
                      onClick={() => setTemp(opt.code)}
                    >
                      {opt.label}
                    </div>
                  );
                })}
              </div>
              <div style={centerMask} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}