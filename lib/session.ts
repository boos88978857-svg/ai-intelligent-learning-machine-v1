// lib/session.ts
// v1 - 单一真源：练习进度（localStorage）
// 同时提供：英文 API + 中文别名 API，避免你贴错字导致 build 爆炸。

export type Subject = "英文" | "數學" | "其他";

export type PracticeSession = {
  id: string;
  subject: Subject;

  // 题目进度
  currentIndex: number;

  // 计时
  elapsedSec: number;

  // 提示
  hintLimit: number;
  hintUsed: number;

  // 答题统计
  correctCount: number;
  wrongCount: number;

  // 暂停
  paused: boolean;

  // 最近更新时间
  updatedAt: number;
};

const LS_KEY_ALL = "aiim.sessions.v1";
const LS_KEY_ACTIVE = "aiim.active.v1";

// ===== 工具 =====
export function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

// ===== 内部读写 =====
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

// ===== CRUD =====
export function listSessions(): PracticeSession[] {
  const all = readAll();
  return Object.values(all).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export function getSession(id: string): PracticeSession | null {
  const all = readAll();
  return all[id] || null;
}

export function upsertSession(s: PracticeSession) {
  const all = readAll();
  all[s.id] = { ...s, updatedAt: Date.now() };
  writeAll(all);
}

export function removeSession(id: string) {
  const all = readAll();
  if (all[id]) {
    delete all[id];
    writeAll(all);
  }
}

export function clearAllSessions() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_KEY_ALL);
  localStorage.removeItem(LS_KEY_ACTIVE);
}

// ===== active id =====
export function getActiveSessionId(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LS_KEY_ACTIVE) || "";
}

export function setActiveSessionId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LS_KEY_ACTIVE, id);
}

export function clearActiveSessionId() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(LS_KEY_ACTIVE);
}

// ===== 创建新进度（给 debug / 入口用）=====
export function newSession(subject: Subject): PracticeSession {
  const id = `${subject}-${Date.now()}`;
  return {
    id,
    subject,
    currentIndex: 0,
    elapsedSec: 0,
    hintLimit: 3,
    hintUsed: 0,
    correctCount: 0,
    wrongCount: 0,
    paused: false,
    updatedAt: Date.now(),
  };
}

// ===== 中文别名（避免你 SessionClient.tsx 里用中文函数名导致报错）=====
export const 取得目前進度id = getActiveSessionId;
export const 設定目前進度id = setActiveSessionId;
export const 刪除目前進度id = clearActiveSessionId;

export const 讀取進度 = getSession;
export const 寫入進度 = upsertSession;
export const 刪除進度 = removeSession;

export const 練習進度列表 = listSessions;
export const 新增進度 = newSession;

export const 格式化時間 = formatTime;
export const 清除全部進度 = clearAllSessions;