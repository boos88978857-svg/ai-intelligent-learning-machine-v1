// lib/lang-config.ts
"use client";

export type LocaleCode =
  | "zh-Hant"
  | "zh-Hans"
  | "en"
  | "ja"
  | "ko";

export type LangConfig = {
  native: LocaleCode;   // 母语
  learning: LocaleCode; // 学习语言
};

const STORAGE_KEY = "langConfig.v1";

const DEFAULT_CONFIG: LangConfig = {
  native: "zh-Hant",
  learning: "en",
};

function safeParse(json: string | null): LangConfig | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    const native = String((obj as any).native ?? "");
    const learning = String((obj as any).learning ?? "");
    if (!native || !learning) return null;
    return { native: native as LocaleCode, learning: learning as LocaleCode };
  } catch {
    return null;
  }
}

export function hasLangConfig(): boolean {
  if (typeof window === "undefined") return false;
  const cfg = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return !!cfg;
}

export function getLangConfig(): LangConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  const cfg = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return cfg ?? DEFAULT_CONFIG;
}

export function setLangConfig(cfg: LangConfig) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
}

export function clearLangConfig() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** 给 UI 用：显示名字 */
export function getLocaleLabel(code: LocaleCode): string {
  switch (code) {
    case "zh-Hant":
      return "中文（繁體）";
    case "zh-Hans":
      return "中文（简体）";
    case "en":
      return "English";
    case "ja":
      return "日本語";
    case "ko":
      return "한국어";
    default:
      return code;
  }
}

/** 给 UI 用：下拉/滚动列表 */
export const LOCALE_OPTIONS: { code: LocaleCode; label: string }[] = [
  { code: "zh-Hant", label: "中文（繁體）" },
  { code: "zh-Hans", label: "中文（简体）" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
];