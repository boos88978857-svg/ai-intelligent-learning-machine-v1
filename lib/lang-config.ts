// lib/lang-config.ts
"use client";

export type LocaleCode =
  | "zh-Hant-TW"
  | "zh-Hans-CN"
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

export type LocaleOption = {
  code: LocaleCode;
  label: string;
  flags: string[]; // ✅ 注意：是 flags（数组）
};

const STORAGE_KEY = "langConfig.v1";

const DEFAULT_CONFIG: LangConfig = {
  native: "zh-Hant-TW",
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

    return { native: native as LocaleCode, learning: learning as LocaleCode };
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
  const opt = LOCALE_OPTIONS.find((x) => x.code === code);
  return opt ? opt.label : code;
}

export function getLocaleLabelWithFlags(code: LocaleCode): string {
  const opt = LOCALE_OPTIONS.find((x) => x.code === code);
  if (!opt) return code;
  return `${opt.label} ${opt.flags.join("")}`.trim();
}

/** ✅ 你指定的语言 + 国家旗帜（同语不同国分开） */
export const LOCALE_OPTIONS: LocaleOption[] = [
  { code: "en-US", label: "English (US)", flags: ["🇺🇸"] },
  { code: "en-GB", label: "English (UK)", flags: ["🇬🇧"] },

  { code: "zh-Hans-CN", label: "中文（简体）", flags: ["🇨🇳"] },
  { code: "zh-Hant-TW", label: "中文（繁體）", flags: ["🇹🇼"] },

  { code: "es-ES", label: "Español (ES)", flags: ["🇪🇸"] },
  { code: "es-MX", label: "Español (MX)", flags: ["🇲🇽"] },

  { code: "fr-FR", label: "Français", flags: ["🇫🇷"] },
  { code: "de-DE", label: "Deutsch", flags: ["🇩🇪"] },

  { code: "ja-JP", label: "日本語", flags: ["🇯🇵"] },
  { code: "ko-KR", label: "한국어", flags: ["🇰🇷"] },

  { code: "pt-PT", label: "Português (PT)", flags: ["🇵🇹"] },
  { code: "pt-BR", label: "Português (BR)", flags: ["🇧🇷"] },

  { code: "it-IT", label: "Italiano", flags: ["🇮🇹"] },
  { code: "ru-RU", label: "Русский", flags: ["🇷🇺"] },
];