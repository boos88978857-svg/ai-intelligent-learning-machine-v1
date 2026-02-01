// app/components/LanguagePickerSheet.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  LOCALE_OPTIONS,
  getLocaleLabelWithFlags,
  type LocaleCode,
} from "../../lib/lang-config";

type Props = {
  open: boolean;
  title: string;
  value: LocaleCode | null; // 允许 null（你要的：未选前不预设）
  onClose: () => void;
  onConfirm: (v: LocaleCode) => void;
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 50,
};

const sheet: React.CSSProperties = {
  position: "fixed",
  left: 0,
  right: 0,
  bottom: 0,
  background: "#fff",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  zIndex: 51,
  // ✅ 接近 iOS 键盘的高度（你说的“不要 2/3 屏”）
  height: "42vh",
  maxHeight: 420,
  minHeight: 280,
  boxShadow: "0 -12px 30px rgba(0,0,0,0.12)",
  display: "flex",
  flexDirection: "column",
};

const sheetTop: React.CSSProperties = {
  padding: "12px 14px 10px",
  borderBottom: "1px solid #eee",
};

const handle: React.CSSProperties = {
  width: 44,
  height: 5,
  borderRadius: 999,
  background: "#ddd",
  margin: "0 auto 10px",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const titleStyle: React.CSSProperties = {
  fontWeight: 900,
  fontSize: 18,
};

const smallBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 800,
};

const content: React.CSSProperties = {
  padding: 12,
  flex: 1,
  display: "flex",
  flexDirection: "column",
  gap: 10,
};

const wheelWrap: React.CSSProperties = {
  position: "relative",
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  background: "#fafafa",
  overflow: "hidden",
  flex: 1,
};

const wheel: React.CSSProperties = {
  height: "100%",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "y mandatory",
  overscrollBehavior: "contain",
  // ✅ 避免 iOS 文字糊：不要在父层搞 opacity/filter/blur/transform
  background: "#fafafa",
};

const row: React.CSSProperties = {
  height: 46,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  scrollSnapAlign: "center",
  fontSize: 18,
  userSelect: "none",
  cursor: "pointer",
  color: "#444",
};

const rowActive: React.CSSProperties = {
  ...row,
  fontWeight: 900,
  color: "#111",
};

const rowInactive: React.CSSProperties = {
  ...row,
  fontWeight: 600,
  color: "#777",
};

const centerLine: React.CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  left: 0,
  right: 0,
  top: "50%",
  transform: "translateY(-50%)",
  height: 46,
  borderTop: "1px solid rgba(0,0,0,0.12)",
  borderBottom: "1px solid rgba(0,0,0,0.12)",
  background: "rgba(255,255,255,0.55)",
};

const footer: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const pill: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  fontSize: 12,
  fontWeight: 800,
  color: "#333",
};

const btnPrimary: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 900,
};

const ITEM_H = 46; // 与 row.height 必须一致
const SPACER_COUNT = 3; // 上下缓冲：让第一/最后也能对齐中线

export default function LanguagePickerSheet({
  open,
  title,
  value,
  onClose,
  onConfirm,
}: Props) {
  const codes = useMemo(() => LOCALE_OPTIONS.map((x) => x.code), []);
  const ref = useRef<HTMLDivElement>(null);

  // ✅ 未选时，sheet 内部用“临时值”滚动；但外层显示仍可保持“未选择”
  const [temp, setTemp] = useState<LocaleCode>(() => value ?? codes[0]);

  // 打开时：初始化 temp + 对齐滚动
  useEffect(() => {
    if (!open) return;
    const initial = value ?? codes[0];
    setTemp(initial);

    // 锁住 body 滚动（解决“滑动整页跟着动”）
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // 等渲染后再 scroll
    requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const idx = Math.max(0, codes.indexOf(initial));
      el.scrollTo({ top: (idx + SPACER_COUNT) * ITEM_H, behavior: "auto" });
    });

    return () => {
      document.body.style.overflow = prev;
    };
  }, [open, value, codes]);

  // 监听滚动 → 吸附选中
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const raw = Math.round(el.scrollTop / ITEM_H) - SPACER_COUNT;
        const idx = Math.max(0, Math.min(codes.length - 1, raw));
        setTemp(codes[idx]);
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
    el.scrollTo({ top: (idx + SPACER_COUNT) * ITEM_H, behavior: "smooth" });
  }

  if (!open) return null;

  return (
    <>
      <div style={overlay} onClick={onClose} />

      <section style={sheet} role="dialog" aria-modal="true">
        <div style={sheetTop}>
          <div style={handle} />
          <div style={headerRow}>
            <div style={titleStyle}>{title}</div>
            <button style={smallBtn} onClick={onClose}>
              关闭
            </button>
          </div>
        </div>

        <div style={content}>
          <div style={wheelWrap}>
            <div
              style={wheel}
              ref={ref}
              // ✅ iOS：把触摸滚动限制在这里，别冒泡到页面
              onTouchMove={(e) => e.stopPropagation()}
              onWheel={(e) => e.stopPropagation()}
            >
              {/* 上缓冲区 */}
              {Array.from({ length: SPACER_COUNT }).map((_, i) => (
                <div key={`top-${i}`} style={{ height: ITEM_H }} />
              ))}

              {LOCALE_OPTIONS.map((opt) => {
                const active = opt.code === temp;
                return (
                  <div
                    key={opt.code}
                    style={active ? rowActive : rowInactive}
                    onClick={() => scrollTo(opt.code)}
                  >
                    {opt.label} {opt.flags.join("")}
                  </div>
                );
              })}

              {/* 下缓冲区 */}
              {Array.from({ length: SPACER_COUNT }).map((_, i) => (
                <div key={`bot-${i}`} style={{ height: ITEM_H }} />
              ))}
            </div>

            <div style={centerLine} />
          </div>

          <div style={footer}>
            <span style={pill}>当前：{getLocaleLabelWithFlags(temp)}</span>
            <button style={btnPrimary} onClick={() => onConfirm(temp)}>
              确定
            </button>
          </div>
        </div>
      </section>
    </>
  );
}