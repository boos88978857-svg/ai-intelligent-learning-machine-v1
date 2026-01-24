// app/practice/session/questions.ts

export type QuestionType = "choice" | "input" | "apply";

export type Question = {
  id: string;
  type: QuestionType;
  prompt: string;

  // choice 題使用
  options?: string[];

  // 正解（先用字串比對；v3-3 再升級成更彈性的判定）
  answer: string;

  // 可選：解析/講解（之後提示與詳解可用）
  explain?: string;
};

// ✅ v3-1：先用「固定假題庫」讓系統跑起來（之後可換成 JSON / DB / API）
export const demoQuestions: Question[] = [
  {
    id: "a1-001",
    type: "choice",
    prompt: "選出正確句子：",
    options: ["He go to school.", "He goes to school.", "He going to school.", "He gone to school."],
    answer: "He goes to school.",
    explain: "第三人稱單數用 goes。",
  },
  {
    id: "a1-002",
    type: "choice",
    prompt: "I ___ a student.",
    options: ["am", "is", "are", "be"],
    answer: "am",
    explain: "I + am。",
  },
  {
    id: "a1-003",
    type: "input",
    prompt: "填空：She ___ (have) a cat.",
    answer: "has",
    explain: "She + has（第三人稱單數）。",
  },
  {
    id: "a1-004",
    type: "choice",
    prompt: "選出正確翻譯：『我喜歡咖啡。』",
    options: ["I like coffee.", "I likes coffee.", "I liking coffee.", "I like coffees."],
    answer: "I like coffee.",
  },
  {
    id: "a1-005",
    type: "apply",
    prompt: "應用：請用英文寫一句話描述你今天的心情（先用 demo：固定答案即可）。",
    answer: "ok",
    explain: "v3-4 會把 apply 題改成可自由輸入＋AI 回饋。",
  },
];

// 工具：用 index 安全取得題目（避免越界）
export function getQuestionByIndex(index: number, list: Question[] = demoQuestions): Question | null {
  if (!Number.isFinite(index)) return null;
  if (index < 0 || index >= list.length) return null;
  return list[index] ?? null;
}

// 工具：題數
export function getTotalQuestions(list: Question[] = demoQuestions): number {
  return list.length;
}