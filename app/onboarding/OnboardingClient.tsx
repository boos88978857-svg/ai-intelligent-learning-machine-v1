// app/onboarding/OnboardingClient.tsx
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
  /** 选完后跳哪里（默认 /home） */
  afterPath?: string;
};

const wrap: React.CSSProperties = { maxWidth: 980, margin: "0 auto", padding: "18px 14px" };

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e6e6e6",
  borderRadius: 18,
  padding: 16,
};

const title: React.CSSProperties = { fontSize: 30, fontWeight: 900, marginBottom: 8 };
const sub: React.CSSProperties = { opacity: 0.75, fontSize: 13, lineHeight: 1.6, marginBottom: 14 };

const grid: React.CSSProperties = { display: "flex", gap: 12, flexWrap: "wrap" };
const col: React.CSSProperties = { flex: "1 1 320px", minWidth: 280 };

const blockTitle: React.CSSProperties = { fontWeight: 900, marginBottom: 8, fontSize: 16 };

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #e6e6e6",
  outline: "none",
  background: "#fff",
};

/** ===== 吸附滚动参数 ===== */
const ITEM_H = 52;
const VIEW_H = 260; // 5 格显示（52*5=260）
const PAD = (VIEW_H - ITEM_H) / 2; // 上下留白让第一项也能对齐中线

const wheelWrap: React.CSSProperties = {
  marginTop: 10,
  borderRadius: 14,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  overflow: "hidden",
  position: "relative",
};

const wheel: React.CSSProperties = {
  height: VIEW_H,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  scrollSnapType: "y mandatory",
  paddingTop: PAD,
  paddingBottom: PAD,
};

const rowItem: React.CSSProperties = {
  height: ITEM_H,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "0 12px",
  cursor: "pointer",
  scrollSnapAlign: "center",
  userSelect: "none",
};

const name: React.CSSProperties = { fontWeight: 800 };
const code: React.CSSProperties = { fontSize: 12, opacity: 0.6 };

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

const tag: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  fontSize: 12,
  opacity: 0.95,
  whiteSpace: "nowrap",
};

const tagActive: React.CSSProperties = {
  ...tag,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

const footer: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  gap: 10,
  alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap",
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

function normalize(s: string) {
  return s.trim().toLowerCase();
}

function isRecommended(code: LocaleCode) {
  return ["zh-Hant", "zh-Hans", "en", "ja", "ko"].includes(code);
}

function filterOptions(query: string) {
  const q = normalize(query);
  if (!q) return LOCALE_OPTIONS;
  return LOCALE_OPTIONS.filter((opt) => {
    const label = normalize(opt.label);
    const c = normalize(opt.code);
    return label.includes(q) || c.includes(q);
  });
}

function sortRecommendedFirst(options: typeof LOCALE_OPTIONS) {
  const rec: typeof LOCALE_OPTIONS = [];
  const rest: typeof LOCALE_OPTIONS = [];
  for (const o of options) (isRecommended(o.code) ? rec : rest).push(o);
  return [...rec, ...rest];
}

/** 吸附滚动：根据 scrollTop 计算当前中心项 */
function getIndexFromScrollTop(scrollTop: number, len: number) {
  const idx = Math.round(scrollTop / ITEM_H);
  return Math.max(0, Math.min(len - 1, idx));
}

function scrollToCode(el: HTMLDivElement | null, idx: number, smooth: boolean) {
  if (!el) return;
  el.scrollTo({ top: idx * ITEM_H, behavior: smooth ? "smooth" : "auto" });
}

export default function OnboardingClient({ afterPath = "/home" }: Props) {
  const router = useRouter();

  const saved = useMemo(() => getLangConfig(), []);
  const [native, setNative] = useState<LocaleCode>(saved.native);
  const [learning, setLearning] = useState<LocaleCode>(saved.learning);

  const [qNative, setQNative] = useState("");
  const [qLearning, setQLearning] = useState("");

  const nativeList = useMemo(() => sortRecommendedFirst(filterOptions(qNative)), [qNative]);
  const learningList = useMemo(() => sortRecommendedFirst(filterOptions(qLearning)), [qLearning]);

  const nativeRef = useRef<HTMLDivElement>(null);
  const learningRef = useRef<HTMLDivElement>(null);

  // ✅ 若搜索过滤后当前选项不在列表里，就自动改成第一项
  useEffect(() => {
    if (nativeList.length === 0) return;
    if (!nativeList.some((x) => x.code === native)) setNative(nativeList[0].code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeList]);

  useEffect(() => {
    if (learningList.length === 0) return;
    if (!learningList.some((x) => x.code === learning)) setLearning(learningList[0].code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningList]);

  // ✅ 当选项变化时，把滚轮对齐到该项（含初始化）
  useEffect(() => {
    const idx = nativeList.findIndex((x) => x.code === native);
    if (idx >= 0) scrollToCode(nativeRef.current, idx, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeList.length]);

  useEffect(() => {
    const idx = learningList.findIndex((x) => x.code === learning);
    if (idx >= 0) scrollToCode(learningRef.current, idx, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningList.length]);

  useEffect(() => {
    const idx = nativeList.findIndex((x) => x.code === native);
    if (idx >= 0) scrollToCode(nativeRef.current, idx, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [native]);

  useEffect(() => {
    const idx = learningList.findIndex((x) => x.code === learning);
    if (idx >= 0) scrollToCode(learningRef.current, idx, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learning]);

  // ✅ 滚动时，更新当前吸附到中心的 code
  useEffect(() => {
    const el = nativeRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const idx = getIndexFromScrollTop(el.scrollTop, nativeList.length);
        const next = nativeList[idx]?.code;
        if (next && next !== native) setNative(next);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nativeList, native]);

  useEffect(() => {
    const el = learningRef.current;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = window.requestAnimationFrame(() => {
        const idx = getIndexFromScrollTop(el.scrollTop, learningList.length);
        const next = learningList[idx]?.code;
        if (next && next !== learning) setLearning(next);
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", onScroll as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learningList, learning]);

  function onConfirm() {
    setLangConfig({ native, learning });
    router.replace(afterPath);
  }

  function onResetToSaved() {
    setQNative("");
    setQLearning("");
    setNative(saved.native);
    setLearning(saved.learning);
  }

  const sameLang = native === learning;

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={title}>开始前先选语言</div>
        <div style={sub}>
          先选<strong>母语</strong>（界面语言），再选<strong>学习语言</strong>。选完后进入首页，之后也能在「设定」里随时更改。
        </div>

        <div style={grid}>
          {/* 母语 */}
          <div style={col}>
            <div style={blockTitle}>① 选择母语（界面语言）</div>

            <input
              style={input}
              value={qNative}
              onChange={(e) => setQNative(e.target.value)}
              placeholder="搜索：中文 / English / ja / ko ..."
            />

            <div style={wheelWrap}>
              <div style={wheel} ref={nativeRef}>
                {nativeList.map((opt) => {
                  const active = opt.code === native;
                  return (
                    <div
                      key={opt.code}
                      style={{
                        ...rowItem,
                        opacity: active ? 1 : 0.55,
                      }}
                      onClick={() => setNative(opt.code)}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={name}>{opt.label}</div>
                        <div style={code}>{opt.code}</div>
                      </div>

                      <span style={active ? tagActive : tag}>{active ? "已选" : "选择"}</span>
                    </div>
                  );
                })}
              </div>
              <div style={centerMask} />
            </div>
          </div>

          {/* 学习语言 */}
          <div style={col}>
            <div style={blockTitle}>② 选择学习语言</div>

            <input
              style={input}
              value={qLearning}
              onChange={(e) => setQLearning(e.target.value)}
              placeholder="搜索：English / 日本語 / 한국어 ..."
            />

            <div style={wheelWrap}>
              <div style={wheel} ref={learningRef}>
                {learningList.map((opt) => {
                  const active = opt.code === learning;
                  return (
                    <div
                      key={opt.code}
                      style={{
                        ...rowItem,
                        opacity: active ? 1 : 0.55,
                      }}
                      onClick={() => setLearning(opt.code)}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <div style={name}>{opt.label}</div>
                        <div style={code}>{opt.code}</div>
                      </div>

                      <span style={active ? tagActive : tag}>{active ? "已选" : "选择"}</span>
                    </div>
                  );
                })}
              </div>
              <div style={centerMask} />
            </div>
          </div>
        </div>

        <div style={footer}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={tag}>母语：{getLocaleLabel(native)}</span>
            <span style={tag}>学习：{getLocaleLabel(learning)}</span>
            {sameLang ? (
              <span style={{ ...tag, border: "1px solid rgba(220,38,38,0.45)" }}>
                ⚠️ 母语与学习语言相同（可继续，但建议不同）
              </span>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button style={btn} onClick={onResetToSaved}>
              还原
            </button>
            <button style={btnPrimary} onClick={onConfirm}>
              进入首页 →
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}