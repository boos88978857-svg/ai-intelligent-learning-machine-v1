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
  native: LocaleCode; // 母语
  learning: LocaleCode; // 学习语言
};

const STORAGE_KEY = "langConfig.v2";

const DEFAULT_CONFIG: LangConfig = {
  native: "zh-TW",
  learning: "en-US",
};

function safeParse(json: string | null): LangConfig | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;
    const native = String((obj as any).native ?? "");
    const learning = String((obj as any).learning ?? "");
    if (!native || !learning) return null;

    // 只允许在名单内的 code
    const ok = (v: string): v is LocaleCode =>
      LOCALE_OPTIONS.some((x) => x.code === v);

    if (!ok(native) || !ok(learning)) return null;
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

export function getLocaleLabel(code: LocaleCode): string {
  return LOCALE_OPTIONS.find((x) => x.code === code)?.label ?? code;
}

export function getLocaleLabelWithFlag(code: LocaleCode): string {
  const opt = LOCALE_OPTIONS.find((x) => x.code === code);
  return opt ? `${opt.label} ${opt.flag}` : code;
}

export type LocaleOption = {
  code: LocaleCode;
  label: string; // 显示名
  flag: string; // emoji flag
};

export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "zh-TW", label: "中文（繁體）", flag: "🇹🇼" },
  { code: "zh-CN", label: "中文（简体）", flag: "🇨🇳" },

  { code: "en-US", label: "English", flag: "🇺🇸" },
  { code: "en-GB", label: "English", flag: "🇬🇧" },

  { code: "es-ES", label: "Español", flag: "🇪🇸" },
  { code: "es-MX", label: "Español", flag: "🇲🇽" },

  { code: "fr-FR", label: "Français", flag: "🇫🇷" },
  { code: "de-DE", label: "Deutsch", flag: "🇩🇪" },

  { code: "ja-JP", label: "日本語", flag: "🇯🇵" },
  { code: "ko-KR", label: "한국어", flag: "🇰🇷" },

  { code: "pt-PT", label: "Português", flag: "🇵🇹" },
  { code: "pt-BR", label: "Português", flag: "🇧🇷" },

  { code: "it-IT", label: "Italiano", flag: "🇮🇹" },
  { code: "ru-RU", label: "Русский", flag: "🇷🇺" },
];