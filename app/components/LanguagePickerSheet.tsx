// app/components/LanguagePickerSheet.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { LOCALE_OPTIONS, getLocaleLabelWithFlags, type LocaleCode } from "../../lib/lang-config";

type Props = {
  open: boolean;
  title: string;
  value: LocaleCode | null;
  onClose: () => void;
  onConfirm: (v: LocaleCode) => void;
};

const ITEM_H = 52; // 每一项高度（越大越好点）
const VISIBLE = 5; // 显示 5 行（中间一行是选中）
const PAD = ((VISIBLE - 1) / 2) * ITEM_H; // 上下 padding，让中间对齐

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.35)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  zIndex: 9999,
};

const sheet: React.CSSProperties = {
  width: "100%",
  maxWidth: 520,
  background: "#fff",
  borderTopLeftRadius: 18,
  borderTopRightRadius: 18,
  boxShadow: "0 -10px 30px rgba(0,0,0,0.15)",
  paddingBottom: 12,
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px 8px",
};

const hTitle: React.CSSProperties = { fontWeight: 900, fontSize: 18 };

const closeBtn: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  background: "#fff",
  padding: "8px 12px",
  borderRadius: 999,
  fontWeight: 800,
  cursor: "pointer",
};

const hint: React.CSSProperties = {
  padding: "0 14px 10px",
  fontSize: 12,
  opacity: 0.7,
  lineHeight: 1.5,
};

const wheelWrap: React.CSSProperties = {
  margin: "0 14px",
  border: "1px solid #e6e6e6",
  borderRadius: 16,
  overflow: "hidden",
  background: "#fafafa",
  position: "relative",
};

const wheel: React.CSSProperties = {
  height: ITEM_H * VISIBLE,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "y mandatory",
  paddingTop: PAD,
  paddingBottom: PAD,

  // ✅ 关键：让手指滑动只作用于这个容器，不带动整页
  overscrollBehavior: "contain",
  touchAction: "pan-y",
};

const row: React.CSSProperties = {
  height: ITEM_H,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  scrollSnapAlign: "center",
  userSelect: "none",
  fontSize: 18,
  fontWeight: 800,
  cursor: "pointer",
};

const fadeTop: React.CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  left: 0,
  right: 0,
  top: 0,
  height: PAD,
  background: "linear-gradient(to bottom, rgba(250,250,250,1), rgba(250,250,250,0))",
};

const fadeBottom: React.CSSProperties = {
  pointerEvents: "none",
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 0,
  height: PAD,
  background: "linear-gradient(to top, rgba(250,250,250,1), rgba(250,250,250,0))",
};

const centerLine: React.CSSProperties = {
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
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "10px 14px 0",
};

const pill: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  background: "#fff",
  padding: "8px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const okBtn: React.CSSProperties = {
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  padding: "10px 14px",
  borderRadius: 12,
  fontWeight: 900,
  cursor: "pointer",
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function LanguagePickerSheet({ open, title, value, onClose, onConfirm }: Props) {
  const list = useMemo(
    () => LOCALE_OPTIONS.map((x) => ({ code: x.code as LocaleCode, label: x.label })),
    []
  );

  const ref = useRef<HTMLDivElement>(null);

  // ✅ Sheet 内部的“当前值”，永远以滚动中心为准
  const [current, setCurrent] = useState<LocaleCode>(list[0].code);

  // ====== 打开时：锁住 body 滚动（避免你说的“滑动整页跟着动”）======
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ====== 打开时：把滚动位置对齐到传入 value（没有 value 就停在第 0 项）======
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;

    const target = value ?? list[0].code;
    setCurrent(target);

    const idx = clamp(list.findIndex((x) => x.code === target), 0, list.length - 1);

    // scrollTop 必须扣掉 padding 才能让那一项落在中心
    const top = idx * ITEM_H;
    requestAnimationFrame(() => {
      el.scrollTo({ top, behavior: "auto" });
    });
  }, [open, value, list]);

  // ====== 根据 scrollTop 计算中心项（核心修复点）======
  useEffect(() => {
    if (!open) return;
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    let snapTimer: any = null;

    const calcIndex = () => {
      // 关键：scrollTop 直接对应 idx*ITEM_H（因为 padding 是在容器内，不算进 scrollTop）
      const idx = clamp(Math.round(el.scrollTop / ITEM_H), 0, list.length - 1);
      return idx;
    };

    const sync = () => {
      const idx = calcIndex();
      const code = list[idx].code;
      setCurrent(code);
    };

    const snapToCenter = () => {
      const idx = calcIndex();
      el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(sync);

      // 停止滚动后吸附一次（更稳）
      clearTimeout(snapTimer);
      snapTimer = setTimeout(snapToCenter, 120);
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    // 初始化同步一次
    sync();

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(snapTimer);
      el.removeEventListener("scroll", onScroll as any);
    };
  }, [open, list]);

  function jumpTo(code: LocaleCode) {
    const el = ref.current;
    if (!el) return;
    const idx = clamp(list.findIndex((x) => x.code === code), 0, list.length - 1);
    setCurrent(code);
    el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  }

  if (!open) return null;

  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={(e) => e.stopPropagation()}>
        <div style={header}>
          <div style={hTitle}>{title}</div>
          <button style={closeBtn} onClick={onClose}>
            关闭
          </button>
        </div>

        <div style={hint}>上下滑动选择（会自动吸附到中间），也可以点某一项直接跳到该位置。</div>

        <div style={wheelWrap}>
          <div style={wheel} ref={ref}>
            {list.map((opt) => {
              const active = opt.code === current;
              return (
                <div
                  key={opt.code}
                  style={{
                    ...row,
                    opacity: active ? 1 : 0.35,
                    transform: active ? "scale(1.02)" : "scale(0.98)",
                  }}
                  onClick={() => jumpTo(opt.code)}
                >
                  {opt.label}
                </div>
              );
            })}
          </div>

          <div style={fadeTop} />
          <div style={fadeBottom} />
          <div style={centerLine} />
        </div>

        <div style={footer}>
          <div style={pill}>当前：{getLocaleLabelWithFlags(current)}</div>
          <button style={okBtn} onClick={() => onConfirm(current)}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
}