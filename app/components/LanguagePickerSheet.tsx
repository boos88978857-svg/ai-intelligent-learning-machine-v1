// app/components/LanguagePickerSheet.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LOCALE_OPTIONS, type LocaleCode, getLocaleLabelWithFlags } from "../../lib/lang-config";

type Props = {
  open: boolean;
  title: string;
  value: LocaleCode;
  onClose: () => void;
  onConfirm: (v: LocaleCode) => void;
};

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
  maxWidth: 980,
  background: "#fff",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 -8px 28px rgba(0,0,0,0.18)",
  padding: "10px 12px 14px",

  // ✅ 半屏高度（你要更矮/更高只改这里）
  height: "52vh",
  maxHeight: "52vh",

  // ✅ 关键：让底部 sheet 自己吃触控滚动，不把滚动交给页面
  overscrollBehavior: "contain",
  touchAction: "pan-y",
};

const handle: React.CSSProperties = {
  width: 42,
  height: 5,
  borderRadius: 999,
  background: "rgba(0,0,0,0.22)",
  margin: "4px auto 10px",
};

const head: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  marginBottom: 10,
};

const hTitle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 16,
};

const btn: React.CSSProperties = {
  padding: "8px 10px",
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

const sub: React.CSSProperties = {
  fontSize: 12,
  opacity: 0.7,
  marginBottom: 10,
  lineHeight: 1.4,
};

const wheelWrap: React.CSSProperties = {
  position: "relative",
  borderRadius: 16,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  overflow: "hidden",
};

const wheel: React.CSSProperties = {
  // ✅ 列表内部滚动（不要让外层滚）
  height: "calc(52vh - 130px)", // 52vh - header/footer 预留
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",

  // ✅ 吸附式滚动
  scrollSnapType: "y mandatory",
  overscrollBehavior: "contain",
  touchAction: "pan-y",
};

const item: React.CSSProperties = {
  height: 46,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  scrollSnapAlign: "center",
  userSelect: "none",
  cursor: "pointer",
  fontSize: 16,

  // ✅ 之前你说“字看不清楚”：不要用过低 opacity
  opacity: 1,
};

const centerMask: React.CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  left: 0,
  right: 0,
  top: "50%",
  transform: "translateY(-50%)",
  height: 46,
  borderTop: "1px solid rgba(0,0,0,0.08)",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(2px)",
};

const foot: React.CSSProperties = {
  marginTop: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  flexWrap: "wrap",
};

const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  fontSize: 12,
  opacity: 0.9,
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function LanguagePickerSheet({ open, title, value, onClose, onConfirm }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const codes = useMemo(() => LOCALE_OPTIONS.map((x) => x.code), []);
  const [picked, setPicked] = useState<LocaleCode>(value);

  // ✅ 打开时同步当前值
  useEffect(() => {
    if (!open) return;
    setPicked(value);
  }, [open, value]);

  // ✅ iOS/手机：打开 sheet 时锁住背景滚动（否则你滑动会带着整页走）
  useEffect(() => {
    if (!open) return;

    const body = document.body;
    const scrollY = window.scrollY;

    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      const y = Math.abs(parseInt(body.style.top || "0", 10)) || 0;
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, y);
    };
  }, [open]);

  function indexOf(v: LocaleCode) {
    const idx = codes.indexOf(v);
    return idx >= 0 ? idx : 0;
  }

  function scrollTo(v: LocaleCode, behavior: ScrollBehavior = "smooth") {
    const el = listRef.current;
    if (!el) return;
    const idx = indexOf(v);
    el.scrollTo({ top: idx * 46, behavior });
  }

  // ✅ 打开后把滚动对齐到当前值（并加上下 padding，让最后一项也能吸附到中间）
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;

    // 让最上/最下也能滚到正中
    const pad = Math.max(0, Math.floor(el.clientHeight / 2 - 23));
    el.style.paddingTop = `${pad}px`;
    el.style.paddingBottom = `${pad}px`;

    scrollTo(picked, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ 滚动时吸附到最近一项，并更新 picked
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const idx = clamp(Math.round(el.scrollTop / 46), 0, codes.length - 1);
        setPicked(codes[idx]);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
  }, [open, codes]);

  if (!open) return null;

  return (
    <div
      style={overlay}
      onClick={(e) => {
        // 点黑色背景关闭
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={handle} />

        <div style={head}>
          <div style={hTitle}>{title}</div>
          <button style={btn} onClick={onClose}>
            关闭
          </button>
        </div>

        <div style={sub}>上下滑动选择（会自动吸附到中间），也可以点某一项直接跳到该位置。</div>

        <div style={wheelWrap}>
          <div style={wheel} ref={listRef}>
            {LOCALE_OPTIONS.map((opt) => {
              const active = opt.code === picked;
              return (
                <div
                  key={`${opt.code}-${opt.label}`}
                  style={{
                    ...item,
                    fontWeight: active ? 900 : 600,
                    color: active ? "#111" : "rgba(17,17,17,0.75)",
                  }}
                  onClick={() => {
                    setPicked(opt.code);
                    scrollTo(opt.code);
                  }}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>
          <div style={centerMask} />
        </div>

        <div style={foot}>
          <span style={pill}>当前选择：{getLocaleLabelWithFlags(picked)}</span>

          <button
            style={btnPrimary}
            onClick={() => {
              onConfirm(picked);
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  );
}