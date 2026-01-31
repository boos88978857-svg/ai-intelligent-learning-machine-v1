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

type Props = { afterPath?: string };

const ITEM_H = 44;

const wrap: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "18px 14px" };

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6e6e6",
  borderRadius: 18,
  padding: 16,
};

const title: React.CSSProperties = { fontSize: 28, fontWeight: 900, marginBottom: 10 };

const sub: React.CSSProperties = {
  opacity: 0.75,
  fontSize: 13,
  lineHeight: 1.6,
  marginBottom: 14,
};

const row: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap" };
const col: React.CSSProperties = { flex: "1 1 280px", minWidth: 260 };
const label: React.CSSProperties = { fontWeight: 900, marginBottom: 8 };

const wheelWrap: React.CSSProperties = {
  position: "relative",
  borderRadius: 16,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  overflow: "hidden",
};

const wheel: React.CSSProperties = {
  height: 260, // 给多一点高度更舒服（你也可改回 240）
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "y mandatory",
  touchAction: "pan-y",
  overscrollBehaviorY: "contain" as any,
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
  background: "rgba(255,255,255,0.45)",
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

const btnPrimary: React.CSSProperties = { ...btn, border: "1px solid #111", background: "#111", color: "#fff" };

function useWheel(initial: LocaleCode) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<LocaleCode>(initial);
  const [pad, setPad] = useState(120);

  const codes = useMemo(() => LOCALE_OPTIONS.map((x) => x.code), []);

  const indexOf = (v: LocaleCode) => {
    const idx = codes.indexOf(v);
    return idx >= 0 ? idx : 0;
  };

  const scrollTo = (v: LocaleCode, behavior: ScrollBehavior = "smooth") => {
    const el = ref.current;
    if (!el) return;
    const idx = indexOf(v);
    el.scrollTo({ top: idx * ITEM_H, behavior });
  };

  // ✅ 动态算上下 spacer 高度：容器高度/2 - item/2 + 一点点余量（关键）
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const calc = () => {
      const h = el.clientHeight || 260;
      const p = Math.max(0, Math.round(h / 2 - ITEM_H / 2) + 24); // +24 解决 iOS 字体/缩放误差
      setPad(p);
    };

    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  // 初始化对齐
  useEffect(() => {
    scrollTo(value, "auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pad]);

  // ✅ scroll -> 取最近 idx
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const idx = Math.round(el.scrollTop / ITEM_H);
        const clamped = Math.max(0, Math.min(codes.length - 1, idx));
        setValue(codes[clamped]);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
  }, [codes]);

  // ✅ iOS：把滑动锁在 wheel，不让事件“漏”到页面
  const onTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    // 关键：preventDefault 会阻止页面滚动（React 的 touchmove 不是 passive）
    e.preventDefault();
  };

  return { ref, value, scrollTo, pad, onTouchMove };
}

export default function LanguageGate({ afterPath = "/home" }: Props) {
  const router = useRouter();
  const saved = useMemo(() => getLangConfig(), []);
  const nativeWheel = useWheel(saved.native);
  const learningWheel = useWheel(saved.learning);

  // ✅ 进入此页：锁住 body 滚动（解决“滑动整个屏幕跟着动”）
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  function onConfirm() {
    setLangConfig({ native: nativeWheel.value, learning: learningWheel.value });
    router.replace(afterPath);
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>选择语言</div>
        <div style={sub}>先选母语（界面语言），再选学习语言。之后可在设定里随时更改。</div>

        <div style={row}>
          {/* 母语 */}
          <div style={col}>
            <div style={label}>母语</div>
            <div style={wheelWrap}>
              <div style={wheel} ref={nativeWheel.ref} onTouchMove={nativeWheel.onTouchMove}>
                {/* ✅ 上 spacer */}
                <div style={{ height: nativeWheel.pad }} />
                {LOCALE_OPTIONS.map((opt) => {
                  const active = opt.code === nativeWheel.value;
                  return (
                    <div
                      key={`native-${opt.code}`}
                      style={{ ...item, fontWeight: active ? 900 : 500, opacity: active ? 1 : 0.55 }}
                      onClick={() => nativeWheel.scrollTo(opt.code)}
                    >
                      {opt.label}
                    </div>
                  );
                })}
                {/* ✅ 下 spacer */}
                <div style={{ height: nativeWheel.pad }} />
              </div>
              <div style={centerMask} />
            </div>
          </div>

          {/* 学习语言 */}
          <div style={col}>
            <div style={label}>学习语言</div>
            <div style={wheelWrap}>
              <div style={wheel} ref={learningWheel.ref} onTouchMove={learningWheel.onTouchMove}>
                <div style={{ height: learningWheel.pad }} />
                {LOCALE_OPTIONS.map((opt) => {
                  const active = opt.code === learningWheel.value;
                  return (
                    <div
                      key={`learn-${opt.code}`}
                      style={{ ...item, fontWeight: active ? 900 : 500, opacity: active ? 1 : 0.55 }}
                      onClick={() => learningWheel.scrollTo(opt.code)}
                    >
                      {opt.label}
                    </div>
                  );
                })}
                <div style={{ height: learningWheel.pad }} />
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

          <button style={btnPrimary} onClick={onConfirm}>
            下一步 →
          </button>
        </div>
      </div>
    </main>
  );
}