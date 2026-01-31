// lib/lang-config.ts
"use client";

export type LocaleCode =
  | "zh-Hant-TW" // 繁中（台湾）
  | "zh-Hans-CN" // 简中（中国）
  | "en-US"      // 英语（美国）
  | "en-GB"      // 英语（英国）
  | "es-ES"      // 西语（西班牙）
  | "es-MX"      // 西语（墨西哥）
  | "fr-FR"      // 法语（法国）
  | "de-DE"      // 德语（德国）
  | "ja-JP"      // 日语（日本）
  | "ko-KR"      // 韩语（韩国）
  | "pt-PT"      // 葡语（葡萄牙）
  | "pt-BR"      // 葡语（巴西）
  | "it-IT"      // 意大利语（意大利）
  | "ru-RU";     // 俄语（俄罗斯）

export type LangConfig = {
  native: LocaleCode;   // 母语
  learning: LocaleCode; // 学习语言
};

export type LocaleOption = {
  code: LocaleCode;
  label: string;
  /** 可选：显示用国旗（一个或多个） */
  flags?: string[];
};

const STORAGE_KEY = "langConfig.v1";

const DEFAULT_CONFIG: LangConfig = {
  native: "zh-Hant-TW",
  learning: "en-US",
};

function isLocaleCode(x: any): x is LocaleCode {
  return LOCALE_OPTIONS.some((o) => o.code === x);
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
  return !!safeParse(window.localStorage.getItem(STORAGE_KEY));
}

export function getLangConfig(): LangConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  return safeParse(window.localStorage.getItem(STORAGE_KEY)) ?? DEFAULT_CONFIG;
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
  const found = LOCALE_OPTIONS.find((x) => x.code === code);
  return found?.label ?? code;
}

/** 给 UI 用：下拉/滚动列表 */
export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "zh-Hant-TW", label: "中文（繁體）", flags: ["🇹🇼"] },
  { code: "zh-Hans-CN", label: "中文（简体）", flags: ["🇨🇳"] },

  { code: "en-US", label: "English", flags: ["🇺🇸"] },
  { code: "en-GB", label: "English", flags: ["🇬🇧"] },

  { code: "es-ES", label: "Español", flags: ["🇪🇸"] },
  { code: "es-MX", label: "Español", flags: ["🇲🇽"] },

  { code: "fr-FR", label: "Français", flags: ["🇫🇷"] },
  { code: "de-DE", label: "Deutsch", flags: ["🇩🇪"] },

  { code: "ja-JP", label: "日本語", flags: ["🇯🇵"] },
  { code: "ko-KR", label: "한국어", flags: ["🇰🇷"] },

  { code: "pt-PT", label: "Português", flags: ["🇵🇹"] },
  { code: "pt-BR", label: "Português", flags: ["🇧🇷"] },

  { code: "it-IT", label: "Italiano", flags: ["🇮🇹"] },
  { code: "ru-RU", label: "Русский", flags: ["🇷🇺"] },
];