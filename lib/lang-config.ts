// lib/lang-config.ts
"use client";

export type LocaleCode =
  | "en-US"
  | "en-GB"
  | "zh-Hans-CN"
  | "zh-Hant-TW"
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
  // ✅ 允许 null：满足“不要预选”
  native: LocaleCode | null;
  learning: LocaleCode | null;
};

export type LocaleOption = {
  code: LocaleCode;
  label: string;
  flags: string[]; // ✅ 统一叫 flags（数组）
};

const STORAGE_KEY = "langConfig.v1";

const DEFAULT_CONFIG: LangConfig = {
  native: null,
  learning: null,
};

function safeParse(json: string | null): LangConfig | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;

    const native = (obj as any).native ?? null;
    const learning = (obj as any).learning ?? null;

    // 允许 null，但如果不是 null 必须是 string
    if (native !== null && typeof native !== "string") return null;
    if (learning !== null && typeof learning !== "string") return null;

    return {
      native: native as LocaleCode | null,
      learning: learning as LocaleCode | null,
    };
  } catch {
    return null;
  }
}

/** ✅ 是否已完成选择（两者都非 null 才算） */
export function hasLangConfig(): boolean {
  if (typeof window === "undefined") return false;
  const cfg = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return !!cfg?.native && !!cfg?.learning;
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
  const hit = LOCALE_OPTIONS.find((x) => x.code === code);
  return hit?.label ?? code;
}

export function getLocaleLabelWithFlag(code: LocaleCode): string {
  const hit = LOCALE_OPTIONS.find((x) => x.code === code);
  if (!hit) return code;
  return `${hit.label} ${hit.flags.join("")}`.trim();
}

/** ✅ 语言清单（你说的“语言 + 国家国旗分开”都在这里） */
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