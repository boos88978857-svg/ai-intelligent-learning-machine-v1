// lib/lang-config.ts
"use client";

export type LocaleCode =
  | "zh-TW"
  | "zh-CN"
  | "en-US"
  | "en-GB"
  | "es-ES"
  | "es-MX"
  | "fr-FR"
  | "de-DE"
  | "ja-JP"
  | "ko-KR"
  | "pt-PT"
  | "pt-BR"
  | "it-IT"
  | "ru-RU";

export type LangConfig = {
  native: LocaleCode;   // 母语
  learning: LocaleCode; // 学习语言
};

const STORAGE_KEY = "langConfig.v1";

export const DEFAULT_CONFIG: LangConfig = {
  native: "zh-TW",
  learning: "en-US",
};

export const LOCALE_OPTIONS: { code: LocaleCode; label: string }[] = [
  { code: "en-US", label: "English 🇺🇸" },
  { code: "en-GB", label: "English 🇬🇧" },

  { code: "zh-CN", label: "中文（简体）🇨🇳" },
  { code: "zh-TW", label: "中文（繁體）🇹🇼" },

  { code: "es-ES", label: "Español 🇪🇸" },
  { code: "es-MX", label: "Español 🇲🇽" },

  { code: "fr-FR", label: "Français 🇫🇷" },
  { code: "de-DE", label: "Deutsch 🇩🇪" },

  { code: "ja-JP", label: "日本語 🇯🇵" },
  { code: "ko-KR", label: "한국어 🇰🇷" },

  { code: "pt-PT", label: "Português 🇵🇹" },
  { code: "pt-BR", label: "Português 🇧🇷" },

  { code: "it-IT", label: "Italiano 🇮🇹" },
  { code: "ru-RU", label: "Русский 🇷🇺" },
];

const ALL_CODES = new Set<LocaleCode>(LOCALE_OPTIONS.map((x) => x.code));

function isLocaleCode(x: any): x is LocaleCode {
  return typeof x === "string" && ALL_CODES.has(x as LocaleCode);
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

export function getLocaleLabel(code: LocaleCode): string {
  const found = LOCALE_OPTIONS.find((x) => x.code === code);
  return found?.label ?? String(code);
}