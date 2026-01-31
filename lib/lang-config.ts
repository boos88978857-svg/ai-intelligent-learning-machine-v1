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
  native: LocaleCode | null;   // 母语（未选为 null）
  learning: LocaleCode | null; // 学习语言（未选为 null）
};

const STORAGE_KEY = "langConfig.v2";

const EMPTY_CONFIG: LangConfig = {
  native: null,
  learning: null,
};

function isLocaleCode(x: any): x is LocaleCode {
  return LOCALE_OPTIONS.some((o) => o.code === x);
}

function safeParse(json: string | null): LangConfig | null {
  if (!json) return null;
  try {
    const obj = JSON.parse(json);
    if (!obj || typeof obj !== "object") return null;

    const nativeRaw = (obj as any).native ?? null;
    const learningRaw = (obj as any).learning ?? null;

    const native = nativeRaw === null ? null : String(nativeRaw);
    const learning = learningRaw === null ? null : String(learningRaw);

    return {
      native: native && isLocaleCode(native) ? (native as LocaleCode) : null,
      learning: learning && isLocaleCode(learning) ? (learning as LocaleCode) : null,
    };
  } catch {
    return null;
  }
}

export function hasLangConfig(): boolean {
  if (typeof window === "undefined") return false;
  const cfg = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return !!cfg?.native && !!cfg?.learning;
}

export function getLangConfig(): LangConfig {
  if (typeof window === "undefined") return EMPTY_CONFIG;
  const cfg = safeParse(window.localStorage.getItem(STORAGE_KEY));
  return cfg ?? EMPTY_CONFIG;
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
  const hit = LOCALE_OPTIONS.find((o) => o.code === code);
  return hit?.label ?? code;
}

export const LOCALE_OPTIONS: { code: LocaleCode; label: string }[] = [
  { code: "en-US", label: "English 🇺🇸" },
  { code: "en-GB", label: "English 🇬🇧" },

  { code: "zh-TW", label: "中文（繁體） 🇹🇼" },
  { code: "zh-CN", label: "中文（简体） 🇨🇳" },

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