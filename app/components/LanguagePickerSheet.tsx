// app/components/LanguagePickerSheet.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LocaleOption, LocaleCode } from "../../lib/lang-config";

type Props = {
  open: boolean;
  title: string;
  value: LocaleCode;
  options: LocaleOption[];
  onClose: () => void;
  onConfirm: (v: LocaleCode) => void;
};

const ITEM_H = 48;
const SPACER_H = 110; // 上下留白，保证首尾也能吸到中线

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 9999,
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const sheet: React.CSSProperties = {
  width: "100%",
  maxWidth: 560,
  background: "#fff",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  border: "1px solid #e6e6e6",
  boxShadow: "0 -12px 40px rgba(0,0,0,0.12)",
};

const head: React.CSSProperties = {
  padding: "12px 14px",
  borderBottom: "1px solid #eee",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const hTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
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

const wheelWrap: React.CSSProperties = {
  position: "relative",
  padding: "10px 14px 18px",
};

const wheel: React.CSSProperties = {
  height: 280,
  borderRadius: 16,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "y mandatory",
  overscrollBehavior: "contain",
  touchAction: "pan-y",
};

const row: React.CSSProperties = {
  height: ITEM_H,
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
  left: 14,
  right: 14,
  top: "50%",
  transform: "translateY(-50%)",
  height: ITEM_H,
  borderTop: "1px solid rgba(0,0,0,0.08)",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(2px)",
  borderRadius: 12,
};

export default function LanguagePickerSheet({
  open,
  title,
  value,
  options,
  onClose,
  onConfirm,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const codes = useMemo(() => options.map((x) => x.code), [options]);

  const [temp, setTemp] = useState<LocaleCode>(value);

  // 打开时：同步 temp + 对齐位置
  useEffect(() => {
    if (!open) return;
    setTemp(value);

    // 锁住 body，避免整页跟着滚（iOS 关键）
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 下一帧再滚动对齐
    const t = window.setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const idx = Math.max(0, codes.indexOf(value));
      el.scrollTo({ top: idx * ITEM_H, behavior: "auto" });
    }, 0);

    return () => {
      window.clearTimeout(t);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, value, codes]);

  // 监听滚动：吸附取整
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / ITEM_H);
        const clamped = Math.max(0, Math.min(codes.length - 1, idx));
        setTemp(codes[clamped]);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
  }, [open, codes]);

  function scrollTo(code: LocaleCode) {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, codes.indexOf(code));
    el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  }

  if (!open) return null;

  return (
    <div
      style={overlay}
      onMouseDown={(e) => {
        // 点遮罩关闭
        if (e.target === e.currentTarget) onClose();
      }}
      onTouchMove={(e) => {
        // iOS：阻止背景滚动
        if (e.target === e.currentTarget) e.preventDefault();
      }}
    >
      <div style={sheet} onTouchMove={(e) => e.stopPropagation()}>
        <div style={head}>
          <div style={hTitle}>{title}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={btn} onClick={onClose}>
              取消
            </button>
            <button style={btnPrimary} onClick={() => onConfirm(temp)}>
              确定
            </button>
          </div>
        </div>

        <div style={wheelWrap}>
          <div style={wheel} ref={ref}>
            {/* 上下 spacer：保证首尾也能吸到中线 */}
            <div style={{ height: SPACER_H }} />
            {options.map((opt) => {
              const active = opt.code === temp;
              return (
                <div
                  key={opt.code}
                  style={{
                    ...row,
                    fontWeight: active ? 900 : 500,
                    opacity: active ? 1 : 0.55,
                    cursor: "pointer",
                  }}
                  onClick={() => scrollTo(opt.code)}
                >
                  {opt.label} {opt.flag}
                </div>
              );
            })}
            <div style={{ height: SPACER_H }} />
          </div>

          <div style={centerMask} />
        </div>
      </div>
    </div>
  );
}