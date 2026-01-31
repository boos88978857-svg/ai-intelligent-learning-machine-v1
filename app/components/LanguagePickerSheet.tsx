// app/components/LanguagePickerSheet.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LocaleOption, LocaleCode } from "../../lib/lang-config";
import { LOCALE_OPTIONS } from "../../lib/lang-config";

type Props = {
  open: boolean;
  title: string;
  value: LocaleCode | null;
  onClose: () => void;
  onPick: (code: LocaleCode) => void;
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
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  background: "#fff",
  border: "1px solid rgba(0,0,0,0.08)",
  boxShadow: "0 -12px 30px rgba(0,0,0,0.18)",
  overflow: "hidden",
};

const header: React.CSSProperties = {
  padding: "14px 14px 10px",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const hTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
};

const closeBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

const body: React.CSSProperties = {
  padding: 14,
};

const wheelWrap: React.CSSProperties = {
  position: "relative",
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.08)",
  background: "#fafafa",
  overflow: "hidden",
};

const wheel: React.CSSProperties = {
  height: 260,
  overflowY: "auto",
  scrollSnapType: "y mandatory",
  WebkitOverflowScrolling: "touch",
  overscrollBehavior: "contain", // ✅ 关键：防止滚动穿透导致整个页面动
  paddingTop: 88, // ✅ 让顶部/底部也能停在中间
  paddingBottom: 88,
};

const item: React.CSSProperties = {
  height: 46,
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
  height: 46,
  borderTop: "1px solid rgba(0,0,0,0.12)",
  borderBottom: "1px solid rgba(0,0,0,0.12)",
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(3px)",
};

const footer: React.CSSProperties = {
  padding: "12px 14px 16px",
  borderTop: "1px solid rgba(0,0,0,0.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
  gap: 10,
};

const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "#fff",
  fontSize: 12,
  opacity: 0.9,
};

const primary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
};

function joinFlags(opt: LocaleOption): string {
  if (!opt.flags || opt.flags.length === 0) return "";
  return opt.flags.join("");
}

export default function LanguagePickerSheet({ open, title, value, onClose, onPick }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // ✅ 以传入 value 为初始；若 null，就默认第一项（但 UI 不会帮你预选，外面控制显示）
  const initial = useMemo<LocaleCode>(() => value ?? LOCALE_OPTIONS[0].code, [value]);
  const [current, setCurrent] = useState<LocaleCode>(initial);

  const codes = useMemo(() => LOCALE_OPTIONS.map((x) => x.code), []);
  const mapByCode = useMemo(() => {
    const m = new Map<LocaleCode, LocaleOption>();
    LOCALE_OPTIONS.forEach((o) => m.set(o.code, o));
    return m;
  }, []);

  function indexOf(code: LocaleCode) {
    const idx = codes.indexOf(code);
    return idx >= 0 ? idx : 0;
  }

  function scrollTo(code: LocaleCode, behavior: ScrollBehavior = "smooth") {
    const el = ref.current;
    if (!el) return;
    const idx = indexOf(code);
    // 46 为 item 高度；加上 paddingTop 的影响我们用 scrollSnap + padding 解决
    el.scrollTo({ top: idx * 46, behavior });
  }

  // ✅ 打开时：锁 body 滚动，且对齐到当前值
  useEffect(() => {
    if (!open) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 对齐到当前值/initial
    setCurrent(initial);
    requestAnimationFrame(() => scrollTo(initial, "auto"));

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [open, initial]);

  // ✅ wheel 滚动更新 current（吸附）
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!open) return;

    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / 46);
        const clamped = Math.max(0, Math.min(codes.length - 1, idx));
        const next = codes[clamped];
        setCurrent(next);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
  }, [open, codes]);

  if (!open) return null;

  const currentOpt = mapByCode.get(current);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <div style={hTitle}>{title}</div>
          <button style={closeBtn} onClick={onClose}>
            关闭
          </button>
        </div>

        <div style={body}>
          <div style={wheelWrap}>
            <div style={wheel} ref={ref}>
              {LOCALE_OPTIONS.map((opt) => {
                const active = opt.code === current;
                return (
                  <div
                    key={opt.code}
                    style={{
                      ...item,
                      fontWeight: active ? 900 : 600,
                      opacity: active ? 1 : 0.55,
                    }}
                    onClick={() => {
                      setCurrent(opt.code);
                      scrollTo(opt.code);
                    }}
                  >
                    {/* ✅ 修复：opt.flag -> opt.flags */}
                    {opt.label} {joinFlags(opt)}
                  </div>
                );
              })}
            </div>
            <div style={centerMask} />
          </div>
        </div>

        <div style={footer}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={pill}>
              已选：{currentOpt?.label ?? current} {currentOpt ? joinFlags(currentOpt) : ""}
            </span>
          </div>

          <button
            style={primary}
            onClick={() => {
              onPick(current);
              onClose();
            }}
          >
            选择 →
          </button>
        </div>
      </div>
    </div>
  );
}