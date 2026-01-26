// app/practice/session/question-bank.ts

export type Question = {
  id: string;
  subject: string; // 例：英文
  stage: string; // 例：A1 / A.T.E.M
  type: "mcq";
  prompt: string;
  choices: string[];
  answer: string; // 正確選項文字（需與 choices 其中一個完全一致）
  hint?: string;
};

type Template = {
  prompt: string;
  choices: string[];
  answer: string;
  hint: string;
};

function makeQ(subject: string, stage: string, i: number, t: Template): Question {
  return {
    id: `en-${stage.split(".").join("").toLowerCase()}-${String(i + 1).padStart(2, "0")}`,
    subject,
    stage,
    type: "mcq",
    prompt: t.prompt,
    choices: t.choices,
    answer: t.answer,
    hint: t.hint,
  };
}

function build20(subject: string, stage: string, templates: Template[]): Question[] {
  // 目標：每個 stage 20 題；用 templates 循環補足
  const out: Question[] = [];
  for (let i = 0; i < 20; i++) {
    const t = templates[i % templates.length];
    out.push(makeQ(subject, stage, i, t));
  }
  return out;
}

/* ======================
   v3-2 題庫補齊：英文
   A1~C2 + A.T.E.M
   每階段 20 題（最小可跑）
====================== */

const SUBJECT = "英文";

/* ---------- A1（基礎入門）---------- */
const A1: Template[] = [
  {
    prompt: "Choose the correct greeting:\nA: ___, how are you?",
    choices: ["Hello", "Goodbye", "Thanks", "Sorry"],
    answer: "Hello",
    hint: "打招呼最常用的是 Hello。",
  },
  {
    prompt: "Choose the correct word:\nI ___ a student.",
    choices: ["am", "is", "are", "be"],
    answer: "am",
    hint: "I 要配 am。",
  },
  {
    prompt: "Choose the correct answer:\nShe ___ happy.",
    choices: ["is", "am", "are", "be"],
    answer: "is",
    hint: "She/He/It 要配 is。",
  },
  {
    prompt: "Choose the correct article:\nThis is ___ apple.",
    choices: ["an", "a", "the", "no article"],
    answer: "an",
    hint: "apple 發音以母音開頭，用 an。",
  },
  {
    prompt: "Choose the correct word:\nThank you! — ___",
    choices: ["You're welcome", "Good night", "See you", "Please"],
    answer: "You're welcome",
    hint: "Thank you 的常見回覆是 You're welcome。",
  },
  {
    prompt: "Choose the correct preposition:\nI'm ___ home.",
    choices: ["at", "on", "in", "to"],
    answer: "at",
    hint: "at home 是固定用法。",
  },
  {
    prompt: "Choose the correct plural:\nTwo ___",
    choices: ["books", "book", "bookes", "book's"],
    answer: "books",
    hint: "一般名詞複數加 s。",
  },
  {
    prompt: "Choose the correct question word:\n___ is your name?",
    choices: ["What", "Where", "When", "Why"],
    answer: "What",
    hint: "問名字用 What。",
  },
];

/* ---------- A2（加強基礎）---------- */
const A2: Template[] = [
  {
    prompt: "Choose the correct tense:\nYesterday, I ___ to the store.",
    choices: ["went", "go", "goes", "going"],
    answer: "went",
    hint: "yesterday 通常用過去式。",
  },
  {
    prompt: "Choose the correct word:\nI can ___ English a little.",
    choices: ["speak", "speaks", "spoke", "speaking"],
    answer: "speak",
    hint: "can + 原形動詞。",
  },
  {
    prompt: "Choose the correct preposition:\nShe is good ___ math.",
    choices: ["at", "in", "on", "to"],
    answer: "at",
    hint: "good at 是固定搭配。",
  },
  {
    prompt: "Choose the correct sentence:",
    choices: [
      "He don't like coffee.",
      "He doesn't like coffee.",
      "He not likes coffee.",
      "He doesn't likes coffee.",
    ],
    answer: "He doesn't like coffee.",
    hint: "He/She/It 否定：doesn't + 原形。",
  },
  {
    prompt: "Choose the correct comparative:\nThis book is ___ than that one.",
    choices: ["better", "good", "best", "more good"],
    answer: "better",
    hint: "good 的比較級是 better。",
  },
  {
    prompt: "Choose the correct question:\n___ you help me?",
    choices: ["Can", "Do", "Did", "Does"],
    answer: "Can",
    hint: "禮貌請求常用 Can you ...?",
  },
  {
    prompt: "Choose the correct quantifier:\nI have ___ friends here.",
    choices: ["some", "any", "much", "a"],
    answer: "some",
    hint: "肯定句常用 some。",
  },
  {
    prompt: "Choose the correct future form:\nI ___ meet you tomorrow.",
    choices: ["will", "am", "was", "were"],
    answer: "will",
    hint: "tomorrow 常用 will + 原形。",
  },
];

/* ---------- B1（實用進階）---------- */
const B1: Template[] = [
  {
    prompt: "Choose the correct modal:\nYou ___ wear a seatbelt. (it's necessary)",
    choices: ["must", "might", "could", "would"],
    answer: "must",
    hint: "強烈必要性常用 must。",
  },
  {
    prompt: "Choose the correct word:\nI look forward to ___ from you.",
    choices: ["hearing", "hear", "heard", "to hear"],
    answer: "hearing",
    hint: "look forward to + V-ing。",
  },
  {
    prompt: "Choose the best connector:\nIt was raining; ___, we went out.",
    choices: ["however", "because", "so that", "since"],
    answer: "however",
    hint: "前後轉折常用 however。",
  },
  {
    prompt: "Choose the correct form:\nIf I ___ time, I will call you.",
    choices: ["have", "had", "will have", "am having"],
    answer: "have",
    hint: "第一類條件句：If + 現在式，主句 will。",
  },
  {
    prompt: "Choose the correct word:\nThis solution is ___ effective than the last one.",
    choices: ["more", "most", "much", "many"],
    answer: "more",
    hint: "比較級：more + 形容詞。",
  },
  {
    prompt: "Choose the correct sentence:",
    choices: [
      "I used to play soccer.",
      "I use to play soccer.",
      "I used play soccer.",
      "I using to play soccer.",
    ],
    answer: "I used to play soccer.",
    hint: "過去習慣：used to + 原形。",
  },
  {
    prompt: "Choose the correct collocation:\nPlease ___ attention to the instructions.",
    choices: ["pay", "take", "make", "do"],
    answer: "pay",
    hint: "pay attention 是固定搭配。",
  },
  {
    prompt: "Choose the correct phrasal verb:\nCan you ___ the volume? It's too loud.",
    choices: ["turn down", "turn up", "turn on", "turn into"],
    answer: "turn down",
    hint: "turn down = 調小。",
  },
];

/* ---------- B2（高階運用）---------- */
const B2: Template[] = [
  {
    prompt: "Choose the correct clause:\nI met the person ___ helped me yesterday.",
    choices: ["who", "where", "when", "why"],
    answer: "who",
    hint: "指人作主語的關係代名詞用 who。",
  },
  {
    prompt: "Choose the correct word:\nThe results were ___ than expected.",
    choices: ["worse", "bad", "worst", "more bad"],
    answer: "worse",
    hint: "bad 的比較級是 worse。",
  },
  {
    prompt: "Choose the correct form:\nNot only ___ late, but he also forgot his notes.",
    choices: ["was he", "he was", "is he", "he is"],
    answer: "was he",
    hint: "Not only 置首常用倒裝：was he / did he ...",
  },
  {
    prompt: "Choose the best meaning:\nShe refused to comment, ___ the rumors.",
    choices: ["despite", "because", "since", "so"],
    answer: "despite",
    hint: "despite = 儘管。",
  },
  {
    prompt: "Choose the correct collocation:\nWe need to ___ a decision soon.",
    choices: ["make", "do", "take", "bring"],
    answer: "make",
    hint: "make a decision 是固定搭配。",
  },
  {
    prompt: "Choose the correct sentence:",
    choices: [
      "I suggest that he go now.",
      "I suggest that he goes now.",
      "I suggest him to go now.",
      "I suggest he to go now.",
    ],
    answer: "I suggest that he go now.",
    hint: "建議句型常見虛擬：suggest that + 主語 + 原形。",
  },
  {
    prompt: "Choose the correct connector:\nWe were late. ___, we still enjoyed the event.",
    choices: ["Nevertheless", "Because", "So that", "Unless"],
    answer: "Nevertheless",
    hint: "nevertheless 表示『儘管如此』。",
  },
  {
    prompt: "Choose the correct word:\nThis policy will ___ a significant impact on costs.",
    choices: ["have", "do", "make", "take"],
    answer: "have",
    hint: "have an impact 是固定搭配。",
  },
];

/* ---------- C1（精準表達）---------- */
const C1: Template[] = [
  {
    prompt: "Choose the best word:\nHis explanation was ___ and easy to follow.",
    choices: ["coherent", "random", "awkward", "vague"],
    answer: "coherent",
    hint: "coherent = 連貫清楚。",
  },
  {
    prompt: "Choose the best connector:\n___ the limitations, the study provides valuable insights.",
    choices: ["Despite", "Because of", "Due to", "Since"],
    answer: "Despite",
    hint: "Despite + 名詞/片語。",
  },
  {
    prompt: "Choose the best phrase:\nThe proposal is good ___, but needs more data.",
    choices: ["in principle", "by accident", "on purpose", "at random"],
    answer: "in principle",
    hint: "in principle = 原則上。",
  },
  {
    prompt: "Choose the best word:\nThe manager tried to ___ the conflict before it escalated.",
    choices: ["defuse", "inflate", "ignore", "provoke"],
    answer: "defuse",
    hint: "defuse = 緩和/化解。",
  },
  {
    prompt: "Choose the correct sentence:",
    choices: [
      "Had I known, I would have acted differently.",
      "If I would have known, I acted differently.",
      "Had I know, I would act differently.",
      "If I had known, I will act differently.",
    ],
    answer: "Had I known, I would have acted differently.",
    hint: "倒裝條件句：Had I known = If I had known。",
  },
  {
    prompt: "Choose the best word:\nHer argument is ___ by strong evidence.",
    choices: ["supported", "supposed", "suspected", "separated"],
    answer: "supported",
    hint: "supported by evidence = 有證據支持。",
  },
  {
    prompt: "Choose the best phrase:\nHe apologized ___ for the inconvenience.",
    choices: ["profusely", "rarely", "barely", "loosely"],
    answer: "profusely",
    hint: "apologize profusely = 深表歉意。",
  },
  {
    prompt: "Choose the best synonym:\nThe results were ___; they could be interpreted in many ways.",
    choices: ["ambiguous", "obvious", "certain", "final"],
    answer: "ambiguous",
    hint: "ambiguous = 模稜兩可。",
  },
];

/* ---------- C2（母語程度）---------- */
const C2: Template[] = [
  {
    prompt: "Choose the best idiom:\nHe finally succeeded, but only ___.",
    choices: ["by the skin of his teeth", "under the weather", "in hot water", "piece of cake"],
    answer: "by the skin of his teeth",
    hint: "by the skin of his teeth = 千鈞一髮。",
  },
  {
    prompt: "Choose the best meaning:\nHer comment was rather ___; it subtly criticized the plan.",
    choices: ["pointed", "silent", "cheerful", "careless"],
    answer: "pointed",
    hint: "pointed remark = 尖銳的一語。",
  },
  {
    prompt: "Choose the best phrase:\nThe new policy is a ___; it benefits everyone.",
    choices: ["win-win", "lose-lose", "wild goose", "red herring"],
    answer: "win-win",
    hint: "win-win = 雙贏。",
  },
  {
    prompt: "Choose the best word:\nThe speaker was ___, moving effortlessly between topics.",
    choices: ["eloquent", "clumsy", "dull", "rigid"],
    answer: "eloquent",
    hint: "eloquent = 雄辯流暢。",
  },
  {
    prompt: "Choose the best word:\nHis response was ___, avoiding the main point entirely.",
    choices: ["evasive", "direct", "helpful", "precise"],
    answer: "evasive",
    hint: "evasive = 迴避的。",
  },
  {
    prompt: "Choose the best phrase:\nThat explanation doesn't ___; it has gaps.",
    choices: ["hold water", "hit the sack", "break the ice", "spill the beans"],
    answer: "hold water",
    hint: "hold water = 站得住腳。",
  },
  {
    prompt: "Choose the best word:\nThe report was ___ with errors and inconsistencies.",
    choices: ["riddled", "filled", "loaded", "piled"],
    answer: "riddled",
    hint: "riddled with = 充斥著。",
  },
  {
    prompt: "Choose the best connector:\nThe claim sounds plausible; ___, the data is insufficient.",
    choices: ["nonetheless", "therefore", "moreover", "instead"],
    answer: "nonetheless",
    hint: "nonetheless = 儘管如此（轉折）。",
  },
];

/* ---------- A.T.E.M（應用混合：Applied / Training / Exam / Mixed）---------- */
const ATEM: Template[] = [
  {
    prompt: "In a restaurant, what do you say to order?\n“I’d like ___.”",
    choices: ["to order", "good night", "no problem", "see you"],
    answer: "to order",
    hint: "點餐常用 I'd like to order / I'd like ...",
  },
  {
    prompt: "Choose the best response:\nA: Excuse me, where is the restroom?\nB: ___",
    choices: ["It's over there.", "I'm fine, thanks.", "Nice to meet you.", "Not at all."],
    answer: "It's over there.",
    hint: "問路/位置：It's over there / It's on the left/right.",
  },
  {
    prompt: "At work, how do you ask for clarification politely?\n“Could you ___ that?”",
    choices: ["clarify", "cancel", "destroy", "delay"],
    answer: "clarify",
    hint: "clarify = 釐清/說明清楚。",
  },
  {
    prompt: "Choose the best email closing:\n“Thank you for your time. ___”",
    choices: ["Best regards,", "What's up?", "See ya!", "No way!"],
    answer: "Best regards,",
    hint: "正式信件常用 Best regards / Sincerely。",
  },
  {
    prompt: "In an exam, which option means 'not sure'?\n“I’m not ___ about this answer.”",
    choices: ["certain", "hungry", "ready", "open"],
    answer: "certain",
    hint: "certain = 確定。",
  },
  {
    prompt: "Choose the correct sentence:",
    choices: ["He goes to school.", "He go to school.", "He going to school.", "He to school goes."],
    answer: "He goes to school.",
    hint: "第三人稱單數現在式動詞加 s。",
  },
  {
    prompt: "In daily life, how do you offer help?\n“Do you need a ___?”",
    choices: ["hand", "stone", "cloud", "knife"],
    answer: "hand",
    hint: "need a hand = 需要幫忙。",
  },
  {
    prompt: "Choose the best phrase:\n“Let’s ___ the meeting to 3 PM.”",
    choices: ["reschedule", "recycle", "rebuild", "remove"],
    answer: "reschedule",
    hint: "reschedule = 改期/重新排程。",
  },
];

/* ======================
   BANK（每階段 20 題）
====================== */
const BANK: Question[] = [
  ...build20(SUBJECT, "A1", A1),
  ...build20(SUBJECT, "A2", A2),
  ...build20(SUBJECT, "B1", B1),
  ...build20(SUBJECT, "B2", B2),
  ...build20(SUBJECT, "C1", C1),
  ...build20(SUBJECT, "C2", C2),
  ...build20(SUBJECT, "A.T.E.M", ATEM),
];

export function getQuestionByIndex(subject: string, stage: string, index: number): Question | null {
  const list = BANK.filter((q) => q.subject === subject && q.stage === stage);
  if (list.length === 0) return null;

  const i = ((index % list.length) + list.length) % list.length;
  return list[i] ?? null;
}

export function getStageCount(subject: string, stage: string): number {
  return BANK.filter((q) => q.subject === subject && q.stage === stage).length;
}

// ✅ v3-2 Step1：用 id 找題目（錯題池需要）
export function getQuestionById(id: string): Question | null {
  return BANK.find((q) => q.id === id) ?? null;
}