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

// ✅ v3-1 最小可跑：每個 stage 至少 3 題（之後 v3-2 我們再補到 20 題）
// ✅ 目前先全用「選擇題 mcq」，流程最穩
const BANK: Question[] = [
  /* ================= 英文 A1 ================= */
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
    prompt: "Choose the correct word:\nThis is ___ book.",
    choices: ["my", "me", "mine", "I"],
    answer: "my",
    hint: "book 前面要用形容詞性所有格 my。",
  },

  /* ================= 英文 A2 ================= */
  {
    id: "en-a2-1",
    subject: "英文",
    stage: "A2",
    type: "mcq",
    prompt: "Choose the correct question:\n___ you like coffee?",
    choices: ["Do", "Does", "Did", "Doing"],
    answer: "Do",
    hint: "主词 you 用 Do。",
  },
  {
    id: "en-a2-2",
    subject: "英文",
    stage: "A2",
    type: "mcq",
    prompt: "Choose the correct sentence:",
    choices: [
      "She don't like it.",
      "She doesn't like it.",
      "She doesn't likes it.",
      "She not like it.",
    ],
    answer: "She doesn't like it.",
    hint: "She/He/It 否定用 doesn't + 原形动词。",
  },
  {
    id: "en-a2-3",
    subject: "英文",
    stage: "A2",
    type: "mcq",
    prompt: "Choose the correct preposition:\nI go to school ___ bus.",
    choices: ["by", "on", "at", "in"],
    answer: "by",
    hint: "by bus 是固定用法。",
  },

  /* ================= 英文 B1 ================= */
  {
    id: "en-b1-1",
    subject: "英文",
    stage: "B1",
    type: "mcq",
    prompt: "Choose the correct tense:\nI ___ this movie before.",
    choices: ["have seen", "saw", "see", "am seeing"],
    answer: "have seen",
    hint: "before 常搭配现在完成式 have seen。",
  },
  {
    id: "en-b1-2",
    subject: "英文",
    stage: "B1",
    type: "mcq",
    prompt: "Choose the best connector:\nI was tired, ___ I finished my homework.",
    choices: ["but", "so", "because", "although"],
    answer: "but",
    hint: "前后转折用 but。",
  },
  {
    id: "en-b1-3",
    subject: "英文",
    stage: "B1",
    type: "mcq",
    prompt: "Choose the correct word:\nPlease ___ me know if you need help.",
    choices: ["let", "make", "take", "get"],
    answer: "let",
    hint: "let me know 是常用句。",
  },

  /* ================= 英文 B2 ================= */
  {
    id: "en-b2-1",
    subject: "英文",
    stage: "B2",
    type: "mcq",
    prompt: "Choose the best option:\nIf I ___ more time, I would travel more.",
    choices: ["had", "have", "will have", "am having"],
    answer: "had",
    hint: "第二类假设：If + 过去式，would + 原形。",
  },
  {
    id: "en-b2-2",
    subject: "英文",
    stage: "B2",
    type: "mcq",
    prompt: "Choose the correct word:\nThis solution is ___ effective than the last one.",
    choices: ["more", "most", "much", "many"],
    answer: "more",
    hint: "than 前面常用比较级 more。",
  },
  {
    id: "en-b2-3",
    subject: "英文",
    stage: "B2",
    type: "mcq",
    prompt: "Choose the correct sentence:",
    choices: [
      "I suggest to take a break.",
      "I suggest taking a break.",
      "I suggest take a break.",
      "I suggest taken a break.",
    ],
    answer: "I suggest taking a break.",
    hint: "suggest 后面接 V-ing。",
  },

  /* ================= 英文 C1 ================= */
  {
    id: "en-c1-1",
    subject: "英文",
    stage: "C1",
    type: "mcq",
    prompt: "Choose the best synonym for “important”:",
    choices: ["significant", "tiny", "ordinary", "random"],
    answer: "significant",
    hint: "significant = important。",
  },
  {
    id: "en-c1-2",
    subject: "英文",
    stage: "C1",
    type: "mcq",
    prompt: "Choose the best word:\nThe report was ___ written and easy to understand.",
    choices: ["clearly", "clear", "clarity", "clearest"],
    answer: "clearly",
    hint: "修饰 written 用副词 clearly。",
  },
  {
    id: "en-c1-3",
    subject: "英文",
    stage: "C1",
    type: "mcq",
    prompt: "Choose the correct option:\nHardly ___ I arrived when it started raining.",
    choices: ["had", "have", "was", "did"],
    answer: "had",
    hint: "Hardly + had + 主词 + 过去分词（倒装）。",
  },

  /* ================= 英文 C2 ================= */
  {
    id: "en-c2-1",
    subject: "英文",
    stage: "C2",
    type: "mcq",
    prompt: "Choose the best phrase:\nThe new policy will ___ a significant impact on costs.",
    choices: ["have", "make", "do", "take"],
    answer: "have",
    hint: "have an impact 是固定搭配。",
  },
  {
    id: "en-c2-2",
    subject: "英文",
    stage: "C2",
    type: "mcq",
    prompt: "Choose the best word:\nHer explanation was so ___ that everyone understood immediately.",
    choices: ["lucid", "muddy", "vague", "unclear"],
    answer: "lucid",
    hint: "lucid = very clear（清晰易懂）。",
  },
  {
    id: "en-c2-3",
    subject: "英文",
    stage: "C2",
    type: "mcq",
    prompt: "Choose the correct sentence:",
    choices: [
      "Not until later did he realize the truth.",
      "Not until later he did realize the truth.",
      "Not until later realized he the truth.",
      "Not until later he realized did the truth.",
    ],
    answer: "Not until later did he realize the truth.",
    hint: "Not until 开头需要倒装：did + 主词 + 原形。",
  },

  /* ================= 英文 A.T.E.M（自订：Applied Training Exam Mixed） ================= */
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

  // ✅ 先用循環，避免題數不足就斷；v3-2 再補滿 20 題
  const i = ((index % list.length) + list.length) % list.length;
  return list[i] ?? null;
}