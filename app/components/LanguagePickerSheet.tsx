"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LocaleCode, LocaleOption } from "../../lib/lang-config";
import { LOCALE_OPTIONS } from "../../lib/lang-config";

type Props = {
  open: boolean;
  title: string;
  value: LocaleCode | null; // ✅ 允许 null（不预选）
  onClose: () => void;
  onConfirm: (value: LocaleCode) => void;
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 1000,
};

const sheetStyle: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  background: "#fff",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  zIndex: 1001,
  maxHeight: "80vh",
  display: "flex",
  flexDirection: "column",
};

const headerStyle: React.CSSProperties = {
  padding: "14px 16px",
  borderBottom: "1px solid #eee",
  fontWeight: 900,
  fontSize: 16,
};

const wheelWrap: React.CSSProperties = {
  position: "relative",
  flex: 1,
  overflow: "hidden",
};

const wheelStyle: React.CSSProperties = {
  height: "100%",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "y mandatory",
};

const itemStyle: React.CSSProperties = {
  height: 48,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  scrollSnapAlign: "center",
  fontSize: 16,
  cursor: "pointer",
};

const footerStyle: React.CSSProperties = {
  padding: 12,
  borderTop: "1px solid #eee",
  display: "flex",
  gap: 10,
};

const btnStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

const btnPrimaryStyle: React.CSSProperties = {
  ...btnStyle,
  background: "#111",
  color: "#fff",
  border: "1px solid #111",
};

export default function LanguagePickerSheet({
  open,
  title,
  value,
  onClose,
  onConfirm,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const options = useMemo(() => LOCALE_OPTIONS, []);
  const itemHeight = 48;

  const [current, setCurrent] = useState<LocaleCode | null>(value);

  // 🔒 打开时锁住 body 滚动
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // 初次打开时对齐（如果有 value）
  useEffect(() => {
    if (!open) return;
    if (!ref.current) return;
    if (!value) return;

    const idx = options.findIndex((o) => o.code === value);
    if (idx >= 0) {
      ref.current.scrollTo({
        top: idx * itemHeight,
        behavior: "auto",
      });
    }
  }, [open, value, options]);

  // 监听滚动 → 计算当前项
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / itemHeight);
        const clamped = Math.max(0, Math.min(options.length - 1, idx));
        setCurrent(options[clamped].code);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll);
    };
  }, [options]);

  if (!open) return null;

  const currentOption = options.find((o) => o.code === current);

  return (
    <>
      <div style={overlayStyle} onClick={onClose} />

      <div style={sheetStyle}>
        <div style={headerStyle}>{title}</div>

        <div style={wheelWrap}>
          <div ref={ref} style={wheelStyle}>
            {options.map((opt: LocaleOption) => {
              const active = opt.code === current;
              return (
                <div
                  key={opt.code}
                  style={{
                    ...itemStyle,
                    fontWeight: active ? 900 : 500,
                    color: active ? "#111" : "#777",
                    background: active ? "#f5f5f5" : "transparent",
                  }}
                  onClick={() => {
                    setCurrent(opt.code);
                    const idx = options.findIndex((o) => o.code === opt.code);
                    ref.current?.scrollTo({
                      top: idx * itemHeight,
                      behavior: "smooth",
                    });
                  }}
                >
                  {opt.label} {opt.flags.join("")}
                </div>
              );
            })}
          </div>
        </div>

        <div style={footerStyle}>
          <button style={btnStyle} onClick={onClose}>
            取消
          </button>
          <button
            style={btnPrimaryStyle}
            disabled={!current}
            onClick={() => {
              if (!current) return;
              onConfirm(current);
            }}
          >
            确定
            {currentOption ? `：${currentOption.label}` : ""}
          </button>
        </div>
      </div>
    </>
  );
}