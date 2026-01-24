// app/practice/session/question-bank.ts

export type Question = {
  id: string;
  subject: string; // 例：英文
  stage: string;   // 例：A1 / A.T.E.M
  type: "mcq";
  prompt: string;
  choices: string[];
  answer: string; // 正確選項文字（需與 choices 其中一個完全一致）
  hint?: string;
};

// ✅ 先給 v3-1 最小可跑：每個 stage 至少 3 題（之後 v3-2 我們再補到 20 題）
const BANK: Question[] = [
  // ===== 英文 A1 =====
  {
    id: "en-a1-1",
    subject: "英文",
    stage: "A1",
    type: "mcq",
    prompt: "Choose the correct greeting:\nA: ___, how are you?",
    choices: ["Hello", "Goodbye", "Thanks", "Sorry"],
    answer: "Hello",
    hint: "打招呼最常用的是 Hello。",
  },
  {
    id: "en-a1-2",
    subject: "英文",
    stage: "A1",
    type: "mcq",
    prompt: "Choose the correct word:\nI ___ a student.",
    choices: ["am", "is", "are", "be"],
    answer: "am",
    hint: "I 要配 am。",
  },
  {
    id: "en-a1-3",
    subject: "英文",
    stage: "A1",
    type: "mcq",
    prompt: "Choose the correct answer:\nWhat is 2 + 2?",
    choices: ["3", "4", "5", "6"],
    answer: "4",
    hint: "2+2=4。",
  },

  // ===== 英文 A.T.E.M（你改名後的 stage）=====
  {
    id: "en-atem-1",
    subject: "英文",
    stage: "A.T.E.M",
    type: "mcq",
    prompt: "In a restaurant, what do you say to order?\n“I’d like ___.”",
    choices: ["to order", "good night", "no problem", "see you"],
    answer: "to order",
    hint: "點餐會用 order。",
  },
  {
    id: "en-atem-2",
    subject: "英文",
    stage: "A.T.E.M",
    type: "mcq",
    prompt: "Choose the best response:\nA: Thank you!\nB: ___",
    choices: ["You’re welcome", "I’m sorry", "Goodbye", "Nice to meet you"],
    answer: "You’re welcome",
    hint: "Thank you 的常見回覆是 You’re welcome。",
  },
  {
    id: "en-atem-3",
    subject: "英文",
    stage: "A.T.E.M",
    type: "mcq",
    prompt: "Choose the correct sentence:",
    choices: ["He go to school.", "He goes to school.", "He going to school.", "He to school goes."],
    answer: "He goes to school.",
    hint: "He/She/It 第三人稱單數要加 s。",
  },
];

export function getQuestionByIndex(subject: string, stage: string, index: number): Question | null {
  const list = BANK.filter((q) => q.subject === subject && q.stage === stage);
  if (list.length === 0) return null;
  // 先用循環，避免題數不足就斷；v3-2 再補滿 20 題
  const i = ((index % list.length) + list.length) % list.length;
  return list[i] ?? null;
}