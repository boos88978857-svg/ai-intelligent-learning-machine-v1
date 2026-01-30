// lib/lang-config.ts
"use client";

export type LocaleCode =
  | "en"          // English
  | "zh-Hant"     // 中文（繁體）
  | "zh-Hans"     // 中文（简体）
  | "es"          // Español
  | "fr"          // Français
  | "de"          // Deutsch
  | "ja"          // 日本語
  | "ko"          // 한국어
  | "pt"          // Português
  | "it"          // Italiano
  | "ru";         // Русский

export type LangConfig = {
  native: LocaleCode;   // 母语
  learning: LocaleCode; // 学习语言
};

const STORAGE_KEY = "langConfig.v1";

const DEFAULT_CONFIG: LangConfig = {
  native: "zh-Hant",
  learning: "en",
};

function isLocaleCode(x: any): x is LocaleCode {
  const s = String(x);
  return [
    "en",
    "zh-Hant",
    "zh-Hans",
    "es",
    "fr",
    "de",
    "ja",
    "ko",
    "pt",
    "it",
    "ru",
  ].includes(s);
}

function safeParse(json: string | null): LangConfig | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    const native = (obj as any).native;
    const learning = (obj as any).learning;
    if (!isLocaleCode(native) || !isLocaleCode(learning)) return null;
    return { native, learning };
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

/** 显示名字（含国旗） */
export function getLocaleLabel(code: LocaleCode): string {
  switch (code) {
    case "en":
      return "English 🇺🇸🇬🇧";
    case "zh-Hant":
      return "中文（繁體）🇹🇼";
    case "zh-Hans":
      return "中文（简体）🇨🇳";
    case "es":
      return "Español 🇪🇸🇲🇽";
    case "fr":
      return "Français 🇫🇷";
    case "de":
      return "Deutsch 🇩🇪";
    case "ja":
      return "日本語 🇯🇵";
    case "ko":
      return "한국어 🇰🇷";
    case "pt":
      return "Português 🇵🇹🇧🇷";
    case "it":
      return "Italiano 🇮🇹";
    case "ru":
      return "Русский 🇷🇺";
    default:
      return code;
  }
}

/** 滚动/选择列表 */
export const LOCALE_OPTIONS: { code: LocaleCode; label: string }[] = [
  { code: "en", label: "English 🇺🇸🇬🇧" },
  { code: "zh-Hant", label: "中文（繁體）🇹🇼" },
  { code: "zh-Hans", label: "中文（简体）🇨🇳" },
  { code: "es", label: "Español 🇪🇸🇲🇽" },
  { code: "fr", label: "Français 🇫🇷" },
  { code: "de", label: "Deutsch 🇩🇪" },
  { code: "ja", label: "日本語 🇯🇵" },
  { code: "ko", label: "한국어 🇰🇷" },
  { code: "pt", label: "Português 🇵🇹🇧🇷" },
  { code: "it", label: "Italiano 🇮🇹" },
  { code: "ru", label: "Русский 🇷🇺" },
];