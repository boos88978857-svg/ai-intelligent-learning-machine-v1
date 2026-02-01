// app/components/LanguagePickerSheet.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LOCALE_OPTIONS, type LocaleCode } from "../../lib/lang-config";

type Props = {
  open: boolean;
  title: string;
  value: LocaleCode | null;
  onClose: () => void;
  onConfirm: (v: LocaleCode) => void;
};

const ITEM_H = 44; // 每一行高度（必须和 UI 一致）

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 50,
  display: "flex",
  alignItems: "flex-end",
};

const sheet: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  border: "1px solid rgba(0,0,0,0.08)",
  // ✅ 键盘感高度：不要太高
  height: "46vh",
  maxHeight: 420,
  padding: 12,
  boxSizing: "border-box",
};

const topRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
};

const closeBtn: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  background: "#fff",
  borderRadius: 999,
  padding: "8px 12px",
  fontWeight: 900,
  cursor: "pointer",
};

const hint: React.CSSProperties = {
  marginTop: 8,
  fontSize: 12,
  opacity: 0.65,
  lineHeight: 1.5,
};

const wheelWrap: React.CSSProperties = {
  marginTop: 10,
  borderRadius: 16,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  overflow: "hidden",
  position: "relative",
};

const wheel: React.CSSProperties = {
  // ✅ 列表高度（像 iOS picker）
  height: "26vh",
  maxHeight: 260,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "y mandatory",
};

const item: React.CSSProperties = {
  height: ITEM_H,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  scrollSnapAlign: "center",
  fontSize: 18,
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
  borderTop: "1px solid rgba(0,0,0,0.10)",
  borderBottom: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.55)",
  backdropFilter: "blur(2px)",
};

const bottomRow: React.CSSProperties = {
  marginTop: 10,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const currentPill: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  background: "#fff",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 13,
  fontWeight: 900,
};

const okBtn: React.CSSProperties = {
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  borderRadius: 12,
  padding: "10px 14px",
  fontWeight: 900,
  cursor: "pointer",
};

export default function LanguagePickerSheet({
  open,
  title,
  value,
  onClose,
  onConfirm,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  const codes = useMemo(() => LOCALE_OPTIONS.map((x) => x.code), []);
  const [current, setCurrent] = useState<LocaleCode>(() => value ?? codes[0]);

  // ✅ 打开时锁住 body 滚动（避免“整页跟着动”）
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ✅ 打开时：把滚轮对齐到当前 value（如果没有，就用 current）
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;

    const v = value ?? current;
    const idx = Math.max(0, codes.indexOf(v));

    // 等 DOM 计算完高度再定位
    requestAnimationFrame(() => {
      const centerOffset = el.clientHeight / 2 - ITEM_H / 2;
      el.scrollTo({ top: idx * ITEM_H - centerOffset, behavior: "auto" });
      setCurrent(codes[idx]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ 核心：用“中线 offset”计算当前选中项（修复你说的：看起来是繁体，系统却当 US）
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;

    let raf = 0;

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const centerOffset = el.clientHeight / 2 - ITEM_H / 2;
        const centerY = el.scrollTop + centerOffset;
        const idx = Math.round(centerY / ITEM_H);
        const clamped = Math.max(0, Math.min(codes.length - 1, idx));
        setCurrent(codes[clamped]);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
  }, [open, codes]);

  // ✅ 点击某项：吸附到中线（不会卡顶/底）
  function scrollTo(code: LocaleCode) {
    const el = listRef.current;
    if (!el) return;
    const idx = Math.max(0, codes.indexOf(code));
    const centerOffset = el.clientHeight / 2 - ITEM_H / 2;
    el.scrollTo({ top: idx * ITEM_H - centerOffset, behavior: "smooth" });
  }

  if (!open) return null;

  const label = LOCALE_OPTIONS.find((x) => x.code === current)?.label ?? String(current);

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={topRow}>
          <div style={titleStyle}>{title}</div>
          <button style={closeBtn} onClick={onClose}>
            关闭
          </button>
        </div>

        <div style={hint}>
          上下滑动选择（会自动吸附到中间），也可以点某一项直接跳到该位置。
        </div>

        <div style={wheelWrap}>
          <div style={wheel} ref={listRef}>
            {/* ✅ 顶部 spacer：让第一项能滚到中线 */}
            <div style={{ height: "calc(13vh)" }} />

            {LOCALE_OPTIONS.map((opt) => {
              const active = opt.code === current;
              return (
                <div
                  key={opt.code}
                  style={{
                    ...item,
                    fontWeight: active ? 900 : 500,
                    opacity: active ? 1 : 0.55,
                  }}
                  onClick={() => scrollTo(opt.code)}
                >
                  {opt.label}
                </div>
              );
            })}

            {/* ✅ 底部 spacer：让最后一项能滚到中线 */}
            <div style={{ height: "calc(13vh)" }} />
          </div>

          <div style={centerMask} />
        </div>

        <div style={bottomRow}>
          <div style={currentPill}>当前：{label}</div>
          <button style={okBtn} onClick={() => onConfirm(current)}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
}