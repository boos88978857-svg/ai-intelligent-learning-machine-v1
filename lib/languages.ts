// /lib/languages.ts

export type UiLocale = "zh-Hant" | "zh-Hans" | "en" | "ja" | "ko";
export type LearnLang = "en" | "ja" | "ko";

/** 你先做：中文↔英文 + 日/韩；后续再扩德法等 */
export const UI_LOCALES: { code: UiLocale; label: string }[] = [
  { code: "zh-Hant", label: "繁體中文" },
  { code: "zh-Hans", label: "简体中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
];

export const LEARN_LANGS: { code: LearnLang; label: string; subjectName: string }[] = [
  { code: "en", label: "英文 English", subjectName: "英文" },
  { code: "ja", label: "日文 日本語", subjectName: "日文" },
  { code: "ko", label: "韩文 한국어", subjectName: "韓文" },
];

/** localStorage keys（以后要全站一致） */
export const LS_UI_LOCALE_KEY = "app.uiLocale.v1";
export const LS_LEARN_LANG_KEY = "app.learnLang.v1";

/** 小工具：防呆读取 */
export function isUiLocale(x: any): x is UiLocale {
  return ["zh-Hant", "zh-Hans", "en", "ja", "ko"].includes(String(x));
}
export function isLearnLang(x: any): x is LearnLang {
  return ["en", "ja", "ko"].includes(String(x));
}