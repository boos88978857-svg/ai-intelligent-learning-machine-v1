// app/components/LanguageGate.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  LOCALE_OPTIONS,
  getLangConfig,
  getLocaleLabel,
  setLangConfig,
  type LocaleCode,
} from "../../lib/lang-config";

type Props = {
  /** 选完后要跳到哪里（默认 /home） */
  afterPath?: string;
};

const ITEM_H = 44;
const WHEEL_H = 240;
// 让“中间选中线”对齐：上/下补空白（使第一个、最后一个也能滚到中间）
const SPACER = Math.floor((WHEEL_H - ITEM_H) / 2);

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
  marginBottom: 10,
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
};

const col: React.CSSProperties = {
  flex: "1 1 280px",
  minWidth: 260,
};

const label: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 8,
};

const wheelWrap: React.CSSProperties = {
  position: "relative",
  borderRadius: 16,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  overflow: "hidden",
};

const wheel: React.CSSProperties = {
  height: WHEEL_H,
  overflowY: "auto",
  scrollSnapType: "y mandatory",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain",
  touchAction: "pan-y",
};

const item: React.CSSProperties = {
  height: ITEM_H,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  scrollSnapAlign: "center",
  fontSize: 16,
  userSelect: "none",
  cursor: "pointer",
};

const centerMask: React.CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  left: 0,
  right: 0,
  top: "50%",
  transform: "translateY(-50%)",
  height: ITEM_H,
  borderTop: "1px solid rgba(0,0,0,0.08)",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(2px)",
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

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function useWheel(initial: LocaleCode) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<LocaleCode>(initial);

  const codes = useMemo(() => LOCALE_OPTIONS.map((x) => x.code), []);

  const indexOf = (v: LocaleCode) => {
    const idx = codes.indexOf(v);
    return idx >= 0 ? idx : 0;
  };

  const scrollToValue = (v: LocaleCode, behavior: ScrollBehavior = "smooth") => {
    const el = ref.current;
    if (!el) return;
    const idx = indexOf(v);
    // ✅ 关键：点选时也要立即更新 value（就算滚不动也能切换）
    setValue(v);
    el.scrollTo({ top: SPACER + idx * ITEM_H, behavior });
  };

  useEffect(() => {
    // 初次进来对齐到中间线
    scrollToValue(value, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const raw = (el.scrollTop - SPACER) / ITEM_H;
        const idx = clamp(Math.round(raw), 0, codes.length - 1);
        const next = codes[idx];
        setValue(next);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
  }, [codes]);

  return { ref, value, scrollToValue, setValue };
}

export default function LanguageGate({ afterPath = "/home" }: Props) {
  const router = useRouter();

  const saved = useMemo(() => getLangConfig(), []);
  const nativeWheel = useWheel(saved.native);
  const learningWheel = useWheel(saved.learning);

  function onConfirm() {
    setLangConfig({ native: nativeWheel.value, learning: learningWheel.value });
    router.replace(afterPath);
  }

  function onResetToSaved() {
    nativeWheel.scrollToValue(saved.native);
    learningWheel.scrollToValue(saved.learning);
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>选择语言</div>
        <div style={sub}>
          先选<strong>母语</strong>，再选<strong>学习语言</strong>。选完后进入首页，之后也能在设定里随时更改。
        </div>

        <div style={row}>
          {/* 母语 */}
          <div style={col}>
            <div style={label}>母语</div>
            <div style={wheelWrap}>
              <div style={wheel} ref={nativeWheel.ref}>
                <div style={{ height: SPACER }} />
                {LOCALE_OPTIONS.map((opt) => {
                  const active = opt.code === nativeWheel.value;
                  return (
                    <div
                      key={opt.code}
                      style={{
                        ...item,
                        fontWeight: active ? 900 : 500,
                        opacity: active ? 1 : 0.55,
                      }}
                      onClick={() => nativeWheel.scrollToValue(opt.code)}
                    >
                      {opt.label}
                    </div>
                  );
                })}
                <div style={{ height: SPACER }} />
              </div>
              <div style={centerMask} />
            </div>
          </div>

          {/* 学习语言 */}
          <div style={col}>
            <div style={label}>学习语言</div>
            <div style={wheelWrap}>
              <div style={wheel} ref={learningWheel.ref}>
                <div style={{ height: SPACER }} />
                {LOCALE_OPTIONS.map((opt) => {
                  const active = opt.code === learningWheel.value;
                  return (
                    <div
                      key={opt.code}
                      style={{
                        ...item,
                        fontWeight: active ? 900 : 500,
                        opacity: active ? 1 : 0.55,
                      }}
                      onClick={() => learningWheel.scrollToValue(opt.code)}
                    >
                      {opt.label}
                    </div>
                  );
                })}
                <div style={{ height: SPACER }} />
              </div>
              <div style={centerMask} />
            </div>
          </div>
        </div>

        <div style={footer}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>母语：{getLocaleLabel(nativeWheel.value)}</span>
            <span style={pill}>学习：{getLocaleLabel(learningWheel.value)}</span>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={btn} onClick={onResetToSaved}>
              还原
            </button>
            <button style={btnPrimary} onClick={onConfirm}>
              下一步 →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}