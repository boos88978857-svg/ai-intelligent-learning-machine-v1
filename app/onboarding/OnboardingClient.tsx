// app/onboarding/OnboardingClient.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  LOCALE_OPTIONS,
  getLangConfig,
  getLocaleLabel,
  hasLangConfig,
  setLangConfig,
  type LocaleCode,
} from "../../lib/lang-config";

/* ================= 基本样式（简洁卡片：A版 Onboarding） ================= */
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

const row: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between",
};

const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  fontSize: 12,
  opacity: 0.95,
};

const footer: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
  justifyContent: "space-between",
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

const btnGhost: React.CSSProperties = {
  ...btn,
  background: "#fff",
};

const section: React.CSSProperties = {
  marginTop: 12,
};

const label: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 8,
};

/* ================= Wheel（吸附滚动，可滑动，不用遮罩覆盖） ================= */
const wheelWrap: React.CSSProperties = {
  position: "relative",
  borderRadius: 16,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  overflow: "hidden",
};

const wheel: React.CSSProperties = {
  height: 240,
  overflowY: "auto",
  scrollSnapType: "y mandatory",
  WebkitOverflowScrolling: "touch",

  // ✅ 关键：把“中心行”顶出来，不用遮罩也能定位中间
  paddingTop: 98, // (240 - 44)/2
  paddingBottom: 98,
};

const item: React.CSSProperties = {
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  scrollSnapAlign: "center",
  fontSize: 16,
  userSelect: "none",
  cursor: "pointer",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useWheel(initial: LocaleCode) {
  const ref = useRef<HTMLDivElement>(null);
  const codes = useMemo(() => LOCALE_OPTIONS.map((x) => x.code), []);
  const [value, setValue] = useState<LocaleCode>(initial);

  function indexOf(v: LocaleCode) {
    const idx = codes.indexOf(v);
    return idx >= 0 ? idx : 0;
  }

  function scrollTo(v: LocaleCode, behavior: ScrollBehavior = "smooth") {
    const el = ref.current;
    if (!el) return;
    const idx = indexOf(v);
    el.scrollTo({ top: idx * 44, behavior });
  }

  // 初始化对齐
  useEffect(() => {
    scrollTo(value, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 滚动时更新当前选中
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / 44);
        const next = codes[clamp(idx, 0, codes.length - 1)];
        setValue(next);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
  }, [codes]);

  return { ref, value, setValue, scrollTo };
}

export default function OnboardingClient() {
  const router = useRouter();

  // 如果已经选过语言，直接进首页（避免你说的「第一次就进 home」问题）
  useEffect(() => {
    if (hasLangConfig()) {
      router.replace("/practice");
    }
  }, [router]);

  const saved = useMemo(() => getLangConfig(), []);
  const nativeWheel = useWheel(saved.native);
  const learningWheel = useWheel(saved.learning);

  // Step 控制：1 = 选母语，2 = 选学习语言
  const [step, setStep] = useState<1 | 2>(1);

  function goNext() {
    if (step === 1) setStep(2);
  }

  function goBack() {
    if (step === 2) setStep(1);
  }

  function onConfirm() {
    setLangConfig({
      native: nativeWheel.value,
      learning: learningWheel.value,
    });
    router.replace("/practice");
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>
          {step === 1 ? "选择你的母语" : "选择你要学习的语言"}
        </div>

        <div style={sub}>
          {step === 1
            ? "我们会用你的母语来解释内容，你之后也可以随时更改。"
            : "这是你接下来主要学习的语言，稍后会进入学习首页。"}
        </div>

        {/* ===== Step 1：母语 ===== */}
        {step === 1 && (
          <div style={section}>
            <div style={label}>母语</div>
            <div style={wheelWrap}>
              <div style={wheel} ref={nativeWheel.ref}>
                {LOCALE_OPTIONS.map((opt) => {
                  const active = opt.code === nativeWheel.value;
                  return (
                    <div
                      key={opt.code}
                      style={{
                        ...item,
                        fontWeight: active ? 900 : 500,
                        opacity: active ? 1 : 0.5,
                      }}
                      onClick={() => nativeWheel.scrollTo(opt.code)}
                    >
                      {opt.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== Step 2：学习语言 ===== */}
        {step === 2 && (
          <div style={section}>
            <div style={label}>学习语言</div>
            <div style={wheelWrap}>
              <div style={wheel} ref={learningWheel.ref}>
                {LOCALE_OPTIONS.map((opt) => {
                  const active = opt.code === learningWheel.value;
                  return (
                    <div
                      key={opt.code}
                      style={{
                        ...item,
                        fontWeight: active ? 900 : 500,
                        opacity: active ? 1 : 0.5,
                      }}
                      onClick={() => learningWheel.scrollTo(opt.code)}
                    >
                      {opt.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ===== 底部：当前选择 + 按钮 ===== */}
        <div style={footer}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>母语：{getLocaleLabel(nativeWheel.value)}</span>
            <span style={pill}>学习：{getLocaleLabel(learningWheel.value)}</span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {step === 2 ? (
              <button style={btn} onClick={goBack}>
                ← 上一步
              </button>
            ) : null}

            {step === 1 ? (
              <button style={btnPrimary} onClick={goNext}>
                下一步 →
              </button>
            ) : (
              <button style={btnPrimary} onClick={onConfirm}>
                完成并进入首页 →
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}