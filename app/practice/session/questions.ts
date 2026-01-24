// app/practice/session/question-bank.ts

export type QuestionType = "mcq" | "input" | "truefalse";

export type Question = {
  id: string;
  subject: string;   // 例：英文
  stage: string;     // 例：A1 / A2 / B1 / A.T.E.M
  type: QuestionType;
  prompt: string;
  choices?: string[]; // mcq 用
  answer?: string;    // demo 用（之後可移除）
  hint?: string;      // demo 用
};

const bank: Question[] = [
  // 英文 A1（示範）
  {
    id: "en-a1-1",
    subject: "英文",
    stage: "A1",
    type: "mcq",
    prompt: "Choose the correct color: The sky is ____.",
    choices: ["blue", "apple", "table", "run"],
    answer: "blue",
    hint: "Think of the sky.",
  },
  {
    id: "en-a1-2",
    subject: "英文",
    stage: "A1",
    type: "mcq",
    prompt: "Choose the correct word: I ____ a student.",
    choices: ["am", "is", "are", "be"],
    answer: "am",
    hint: "I + ?",
  },

  // 英文 A.T.E.M（示範）
  {
    id: "en-atem-1",
    subject: "英文",
    stage: "A.T.E.M",
    type: "mcq",
    prompt: "Applied: Pick the best response.\nA: How are you?\nB: ____",
    choices: ["I'm fine, thanks.", "Blue.", "Twelve.", "Because."],
    answer: "I'm fine, thanks.",
    hint: "A greeting reply.",
  },

  // 數學 A1（示範）
  {
    id: "math-a1-1",
    subject: "數學",
    stage: "A1",
    type: "mcq",
    prompt: "12 ÷ 3 = ?",
    choices: ["3", "4", "6", "9"],
    answer: "4",
    hint: "Divide equally.",
  },
];

export function getQuestions(subject: string, stage: string): Question[] {
  return bank.filter((q) => q.subject === subject && q.stage === stage);
}

export function getQuestionByIndex(subject: string, stage: string, index: number): Question | null {
  const list = getQuestions(subject, stage);
  if (index < 0 || index >= list.length) return null;
  return list[index];
}