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

const ITEM_H = 44;

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  zIndex: 999,
  display: "flex",
  alignItems: "flex-end",
};

const sheet: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  border: "1px solid rgba(0,0,0,0.08)",
  // ✅ 更像键盘的高度（半屏偏矮）
  height: "38vh",
  maxHeight: 340,
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
  // ✅ wheel 高度也跟着变矮一点
  height: "20vh",
  maxHeight: 220,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "y mandatory",
  // ✅ 关键：避免滚动串到外层页面（移动端）
  overscrollBehavior: "contain",
  touchAction: "pan-y",
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
  background: "rgba(255,255,255,0.65)",
  // ✅ 不要 blur（会糊字）
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

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function LanguagePickerSheet({
  open,
  title,
  value,
  onClose,
  onConfirm,
}: Props) {
  const listRef = useRef<HTMLDivElement>(null);

  const codes = useMemo(() => LOCALE_OPTIONS.map((x) => x.code), []);
  const [spacerPx, setSpacerPx] = useState(0);

  // ✅ current 永远是“白长框中线对到的那一项”
  const [current, setCurrent] = useState<LocaleCode>(() => value ?? codes[0]);

  // ✅ 打开时锁 body，避免“整页跟着滑”
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ✅ 打开时：计算 spacer + 对齐到 value（或 current）
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;

    const calc = () => {
      const s = Math.max(0, (el.clientHeight - ITEM_H) / 2);
      setSpacerPx(s);

      const v = value ?? current;
      const idx = clamp(codes.indexOf(v), 0, codes.length - 1);

      // ✅ 有 paddingTop/Bottom spacer 后：直接 idx * ITEM_H 就能居中
      el.scrollTo({ top: idx * ITEM_H, behavior: "auto" });
      setCurrent(codes[idx] ?? codes[0]);
    };

    // iOS：两次 RAF 更稳
    requestAnimationFrame(() => requestAnimationFrame(calc));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ✅ 关键：用“容器中线”算 index，保证白长框=选中
  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;

    let raf = 0;

    const calcIndexFromScroll = () => {
      // 容器中线在滚动内容中的位置
      const centerPos = el.scrollTop + el.clientHeight / 2;

      // 第一项中心 = spacerPx + ITEM_H/2
      // 所以 idx = round((centerPos - spacerPx - ITEM_H/2) / ITEM_H)
      const raw = (centerPos - spacerPx - ITEM_H / 2) / ITEM_H;
      const idx = clamp(Math.round(raw), 0, codes.length - 1);
      setCurrent(codes[idx] ?? codes[0]);
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(calcIndexFromScroll);
    };

    el.addEventListener("scroll", onScroll, { passive: true });

    // ✅ 打开瞬间也算一次，避免“当前显示不对”
    requestAnimationFrame(calcIndexFromScroll);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
  }, [open, codes, spacerPx]);

  function scrollTo(code: LocaleCode) {
    const el = listRef.current;
    if (!el) return;
    const idx = clamp(codes.indexOf(code), 0, codes.length - 1);
    el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  }

  if (!open) return null;

  const label =
    LOCALE_OPTIONS.find((x) => x.code === current)?.label ?? String(current);

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
            {/* ✅ paddingTop/Bottom 让第一项/最后一项都能滚到中线 */}
            <div style={{ paddingTop: spacerPx, paddingBottom: spacerPx }}>
              {LOCALE_OPTIONS.map((opt) => {
                const active = opt.code === current;
                return (
                  <div
                    key={opt.code}
                    style={{
                      ...item,
                      fontWeight: active ? 900 : 500,
                      color: active ? "#111" : "#555",
                      opacity: active ? 1 : 0.55,
                    }}
                    onClick={() => scrollTo(opt.code)}
                  >
                    {opt.label}
                  </div>
                );
              })}
            </div>
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