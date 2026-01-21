export type Subject = "英文" | "數學" | "其他";

export type QuestionType = "choice" | "short" | "application";

export type ChoiceQuestion = {
  id: string;
  type: "choice";
  prompt: string;
  choices: string[];
  answerIndex: number;
  hintSteps: string[];
};

export type ShortQuestion = {
  id: string;
  type: "short";
  prompt: string;
  answerText: string;
  hintSteps: string[];
};

export type ApplicationQuestion = {
  id: string;
  type: "application";
  prompt: string;
  answerText: string;
  hintSteps: string[];
};

export type Question = ChoiceQuestion | ShortQuestion | ApplicationQuestion;

export type PracticeSession = {
  id: string;
  subject: Subject;

  // 回合設定
  totalQuestions: number; // 固定 20
  hintLimit: number; // 固定 5

  // 進度
  currentIndex: number; // 0~19
  elapsedSec: number; // 累積秒數
  paused: boolean;

  // 成績
  correct: number;
  wrong: number;

  // 提示
  hintUsed: number; // 0~hintLimit
};

const LS_KEY_ALL = "aiim.sessions.v1";
const LS_KEY_ACTIVE = "aiim.active.v1";

// ===== 工具 =====
export function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function readAll(): Record<string, PracticeSession> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(LS_KEY_ALL);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeAll(all: Record<string, PracticeSession>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY_ALL, JSON.stringify(all));
}

export function getActiveSessionId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LS_KEY_ACTIVE) || "";
}

export function setActiveSessionId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY_ACTIVE, id);
}

export function listSessions(): PracticeSession[] {
  const all = readAll();
  return Object.values(all).sort((a, b) => (b.elapsedSec - a.elapsedSec));
}

export function getSession(id: string): PracticeSession | null {
  const all = readAll();
  return all[id] || null;
}

export function upsertSession(s: PracticeSession) {
  const all = readAll();
  all[s.id] = s;
  writeAll(all);
}

export function removeSession(id: string) {
  const all = readAll();
  if (all[id]) {
    delete all[id];
    writeAll(all);
  }
  // 如果删的是 active，就清掉
  if (getActiveSessionId() === id) {
    setActiveSessionId("");
  }
}

export function clearAllSessions() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_KEY_ALL);
  localStorage.removeItem(LS_KEY_ACTIVE);
}

// ===== 建立新進度（由不同科目入口呼叫）=====
export function newSession(subject: Subject): PracticeSession {
  const id = `${subject}-${Date.now()}`;
  const s: PracticeSession = {
    id,
    subject,
    totalQuestions: 20,
    hintLimit: 5,

    currentIndex: 0,
    elapsedSec: 0,
    paused: false,

    correct: 0,
    wrong: 0,

    hintUsed: 0
  };

  upsertSession(s);
  setActiveSessionId(id);
  return s;
}

// ===== 題目（示範：之後會換成你的自建題庫系統）=====
export function getMockQuestions(subject: Subject): Question[] {
  if (subject === "英文") {
    return [
      {
        id: "en-1",
        type: "choice",
        prompt: "請選出「藍色」的英文：",
        choices: ["Apple", "Blue", "Dog", "Book"],
        answerIndex: 1,
        hintSteps: ["想想顏色", "Blue = 藍色"]
      },
      {
        id: "en-2",
        type: "short",
        prompt: "請輸入「謝謝」的英文：",
        answerText: "thank you",
        hintSteps: ["兩個字", "thank you（不分大小寫）"]
      }
    ];
  }

  if (subject === "數學") {
    return [
      {
        id: "ma-1",
        type: "application",
        prompt: "小明有 12 顆糖，平均分給 3 個朋友，每人可以分到幾顆？",
        answerText: "4",
        hintSteps: ["想想除法", "12 ÷ 3 = 4"]
      },
      {
        id: "ma-2",
        type: "choice",
        prompt: "下列哪個是質數？",
        choices: ["4", "6", "9", "11"],
        answerIndex: 3,
        hintSteps: ["只能被 1 和自己整除", "11 是質數"]
      }
    ];
  }

  return [
    {
      id: "ot-1",
      type: "short",
      prompt: "（其他學科示範）請輸入：地球是第幾顆行星？",
      answerText: "3",
      hintSteps: ["從太陽開始數", "水金地火...地球是第 3 顆"]
    }
  ];
}

// ===== 作答流程輔助 =====

// 使用提示（最多 hintLimit 次）
export function useHint(s: PracticeSession): PracticeSession {
  if (s.hintUsed >= s.hintLimit) return s;
  const next: PracticeSession = {
    ...s,
    hintUsed: s.hintUsed + 1
  };
  upsertSession(next);
  return next;
}

// 提交答案
export function submitAnswer(
  s: PracticeSession,
  q: Question,
  userAnswer: string | number
): { nextSession: PracticeSession; correct: boolean } {
  let isCorrect = false;

  if (q.type === "choice") {
    isCorrect = Number(userAnswer) === q.answerIndex;
  } else {
    const a = String(userAnswer).trim().toLowerCase();
    const b = q.answerText.trim().toLowerCase();
    isCorrect = a === b;
  }

  const next: PracticeSession = {
    ...s,
    correct: isCorrect ? s.correct + 1 : s.correct,
    wrong: !isCorrect ? s.wrong + 1 : s.wrong
  };

  upsertSession(next);
  return { nextSession: next, correct: isCorrect };
}

// 下一題（防止超過 20 題）
export function goNext(s: PracticeSession): PracticeSession {
  if (s.currentIndex + 1 >= s.totalQuestions) {
    return s; // 回合結束（UI 會判斷）
  }

  const next: PracticeSession = {
    ...s,
    currentIndex: s.currentIndex + 1
  };

  upsertSession(next);
  return next;
}

// 暫停 / 繼續
export function togglePause(s: PracticeSession): PracticeSession {
  const next: PracticeSession = {
    ...s,
    paused: !s.paused
  };
  upsertSession(next);
  return next;
}