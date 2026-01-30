// app/onboarding/OnboardingClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
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

const listWrap: React.CSSProperties = {
  marginTop: 10,
  borderRadius: 14,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  overflow: "hidden",
};

const list: React.CSSProperties = {
  maxHeight: 260,
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
};

const rowItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
  padding: "12px 12px",
  borderBottom: "1px solid rgba(0,0,0,0.06)",
  cursor: "pointer",
  background: "transparent",
};

const name: React.CSSProperties = { fontWeight: 800 };
const code: React.CSSProperties = { fontSize: 12, opacity: 0.6 };

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
  // 先做这 5 个，未来扩语言也能继续加
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

export default function OnboardingClient({ afterPath = "/home" }: Props) {
  const router = useRouter();

  // ✅ 初始化：读取已存（如果没存则使用默认）
  const saved = useMemo(() => getLangConfig(), []);
  const [native, setNative] = useState<LocaleCode>(saved.native);
  const [learning, setLearning] = useState<LocaleCode>(saved.learning);

  const [qNative, setQNative] = useState("");
  const [qLearning, setQLearning] = useState("");

  const nativeList = useMemo(() => sortRecommendedFirst(filterOptions(qNative)), [qNative]);
  const learningList = useMemo(() => sortRecommendedFirst(filterOptions(qLearning)), [qLearning]);

  // 如果用户之前没选过，仍然允许默认显示，但按下「进入首页」才算真正确认
  // （你 root page 的逻辑可以用 hasLangConfig 来判断有没有存过）
  useEffect(() => {
    // 如果 saved 里没有值，这里也会是 default，不做任何跳转
  }, []);

  function onConfirm() {
    setLangConfig({ native, learning });
    router.replace(afterPath);
  }

  function onResetToSaved() {
    setNative(saved.native);
    setLearning(saved.learning);
    setQNative("");
    setQLearning("");
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

            <div style={listWrap}>
              <div style={list}>
                {nativeList.map((opt) => {
                  const active = opt.code === native;
                  return (
                    <div
                      key={opt.code}
                      style={{
                        ...rowItem,
                        background: active ? "rgba(0,0,0,0.06)" : "transparent",
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

            <div style={listWrap}>
              <div style={list}>
                {learningList.map((opt) => {
                  const active = opt.code === learning;
                  return (
                    <div
                      key={opt.code}
                      style={{
                        ...rowItem,
                        background: active ? "rgba(0,0,0,0.06)" : "transparent",
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