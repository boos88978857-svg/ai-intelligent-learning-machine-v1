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