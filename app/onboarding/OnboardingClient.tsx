// app/onboarding/OnboardingClient.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  UI_LOCALES,
  LEARN_LANGS,
  LS_UI_LOCALE_KEY,
  LS_LEARN_LANG_KEY,
  type UiLocale,
  type LearnLang,
  isUiLocale,
  isLearnLang,
} from "../../lib/lang-config";

// ✅ 读错题本快照：没错题就隐藏入口卡
import { getWrongBookSnapshot } from "../../lib/wrong-book";

const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "14px 0" };

const card: React.CSSProperties = {
  padding: 14,
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const row: React.CSSProperties = { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" };

const pill: React.CSSProperties = {
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 12,
  whiteSpace: "nowrap",
  cursor: "pointer",
};

const pillActive: React.CSSProperties = {
  ...pill,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(12, 1fr)",
  gap: 12,
};

function col(span: number): React.CSSProperties {
  return {
    gridColumn: `span ${span} / span ${span}`,
    minWidth: 0,
  };
}

const btn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

function countWrong(snapshot: any): number {
  if (!snapshot || typeof snapshot !== "object") return 0;
  let total = 0;
  for (const subj of Object.keys(snapshot)) {
    const stages = snapshot[subj];
    if (!stages || typeof stages !== "object") continue;
    for (const st of Object.keys(stages)) {
      const arr = stages[st];
      if (Array.isArray(arr)) total += arr.length;
    }
  }
  return total;
}

export default function OnboardingClient() {
  const router = useRouter();

  const [uiLocale, setUiLocale] = useState<UiLocale>("zh-Hant");
  const [learnLang, setLearnLang] = useState<LearnLang>("en");

  const [wrongTotal, setWrongTotal] = useState<number>(0);

  // ✅ 初次读取 localStorage 选择
  useEffect(() => {
    try {
      const u = localStorage.getItem(LS_UI_LOCALE_KEY);
      const l = localStorage.getItem(LS_LEARN_LANG_KEY);
      if (u && isUiLocale(u)) setUiLocale(u);
      if (l && isLearnLang(l)) setLearnLang(l);
    } catch {}
  }, []);

  // ✅ 计算错题总数（没有错题就隐藏错题入口卡）
  useEffect(() => {
    try {
      const snap = getWrongBookSnapshot();
      setWrongTotal(countWrong(snap));
    } catch {
      setWrongTotal(0);
    }
  }, []);

  const localeLabel = useMemo(() => {
    return UI_LOCALES.find((x) => x.code === uiLocale)?.label ?? uiLocale;
  }, [uiLocale]);

  const learnLabel = useMemo(() => {
    return LEARN_LANGS.find((x) => x.code === learnLang)?.label ?? learnLang;
  }, [learnLang]);

  function pickUiLocale(code: UiLocale) {
    setUiLocale(code);
    try {
      localStorage.setItem(LS_UI_LOCALE_KEY, code);
    } catch {}
  }

  function pickLearnLang(code: LearnLang) {
    setLearnLang(code);
    try {
      localStorage.setItem(LS_LEARN_LANG_KEY, code);
    } catch {}
  }

  // ✅ 入口：先不改你既有练习架构
  function goLearnHub() {
    // 先导到练习区（后续你要做 hub 页，我们再把这里改成 /hub）
    router.push("/practice");
  }

  function goWrongBook() {
    router.push("/practice/wrong");
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={{ fontWeight: 900, fontSize: 28 }}>🌍 国际语言学习平台</div>
        <div style={{ opacity: 0.75, marginTop: 6, lineHeight: 1.6 }}>
          先选母语，再选学习语言。后续可扩充更多语言与功能。
        </div>

        <div style={{ height: 12 }} />

        <div style={row}>
          <span style={{ ...pill, cursor: "default" }}>母语：{localeLabel}</span>
          <span style={{ ...pill, cursor: "default" }}>学习：{learnLabel}</span>
          {wrongTotal > 0 ? <span style={{ ...pill, cursor: "default" }}>错题：{wrongTotal} 题</span> : null}
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div style={grid}>
        {/* 左：选择母语 */}
        <div style={{ ...card, ...col(12) }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>① 选择母语（界面语言）</div>
          <div style={row}>
            {UI_LOCALES.map((x) => (
              <button
                key={x.code}
                style={x.code === uiLocale ? pillActive : pill}
                onClick={() => pickUiLocale(x.code)}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>

        {/* 右：选择学习语言 */}
        <div style={{ ...card, ...col(12) }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>② 选择学习语言</div>
          <div style={row}>
            {LEARN_LANGS.map((x) => (
              <button
                key={x.code}
                style={x.code === learnLang ? pillActive : pill}
                onClick={() => pickLearnLang(x.code)}
              >
                {x.label}
              </button>
            ))}
          </div>
        </div>

        {/* 入口卡：学习 */}
        <div style={{ ...col(12) }}>
          <button style={btnPrimary} onClick={goLearnHub}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>🚀 进入学习</div>
            <div style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.6 }}>
              句型 / 工作 / 旅游 / 留学 / 移民 / 会话（先从现有练习区接）
            </div>
            <div style={{ opacity: 0.65, marginTop: 6, fontSize: 12 }}>
              预留版位：之后会把这里改成「学习入口 Hub」页
            </div>
          </button>
        </div>

        {/* 入口卡：错题本（✅ 没错题就隐藏） */}
        {wrongTotal > 0 ? (
          <div style={{ ...col(12) }}>
            <button style={btn} onClick={goWrongBook}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>📕 错题本</div>
              <div style={{ opacity: 0.8, marginTop: 6, lineHeight: 1.6 }}>
                依「科目 → 阶段」整理错题；答对自动移除
              </div>
              <div style={{ opacity: 0.65, marginTop: 6, fontSize: 12 }}>当前错题：{wrongTotal} 题</div>
            </button>
          </div>
        ) : null}

        {/* 预留：未来功能入口（不做交友、不碰版权） */}
        <div style={{ ...col(12) }}>
          <div style={{ ...card, opacity: 0.85 }}>
            <div style={{ fontWeight: 900, marginBottom: 6 }}>🧩 预留版位（未来）</div>
            <div style={{ lineHeight: 1.7, fontSize: 13, opacity: 0.8 }}>
              - 竞技场（匹配对战 / 排行）<br />
              - AI 对话（无人在线时 fallback）<br />
              - 旅游实时对谈翻译（订阅/额度制）
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}