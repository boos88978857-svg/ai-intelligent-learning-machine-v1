// lib/session.ts
// ai智能學習機：續做（Session）核心
// - 支援多科目同時做到一半
// - 全部使用繁體中文命名與註解
// - 使用 localStorage 儲存（先跑起來，之後可替換成後端）

export type 科目 = "英文" | "數學" | "其他學科";

export type 題型 = "選擇題" | "是非題" | "填空題" | "簡答題" | "應用題";

export type 選項 = {
  id: string; // 例如 "A"
  text: string;
};

export type 題目 = {
  id: string;
  科目: 科目;
  題型: 題型;
  題幹: string;
  選項?: 選項[]; // 選擇題用
  正確答案?: string; // 選擇題/是非題/填空題可用（示範用，正式題庫會更完整）
  提示?: string[]; // 例如：最多 5 則提示
  工具?: {
    涂鴉牆?: boolean;
    珠算?: boolean;
  };
};

export type 進度狀態 = "進行中" | "已完成";

export type 作答記錄 = {
  題目id: string;
  使用者答案: string;
  是否正確: boolean;
};

export type 練習進度 = {
  id: string;
  科目: 科目;

  // 回合設定
  本回合題數: number; // 例如 20
  目前題號: number; // 0-based

  // 計時/暫停
  已用秒數: number;
  是否暫停: boolean;

  // 提示（例如：每回合 5 次）
  提示上限: number;
  已用提示: number;

  // 統計（先放著，之後 UI 要顯示就不會再型別爆）
  答對數: number;
  答錯數: number;

  // 作答資料
  題目清單: 題目[];
  作答紀錄: 作答記錄[];

  狀態: 進度狀態;
  建立時間: number;
  更新時間: number;
};

// ===== localStorage Key（不要改動字串，避免資料讀不到）=====
const KEY_PREFIX = "aiim_session_v1:";
const KEY_ACTIVE = "aiim_active_session_v1";

function now() {
  return Date.now();
}

function keyOf(id: string) {
  return `${KEY_PREFIX}${id}`;
}

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ===== 產生示範題目（先用假資料讓流程跑起來；正式題庫後續再接）=====
function 產生示範題目(科目: 科目, 本回合題數: number): 題目[] {
  const out: 題目[] = [];

  for (let i = 0; i < 本回合題數; i++) {
    if (科目 === "英文") {
      out.push({
        id: `en-${i + 1}`,
        科目,
        題型: "選擇題",
        題幹: `（示範）請選出正確翻譯：Apple = ?（第 ${i + 1} 題）`,
        選項: [
          { id: "A", text: "蘋果" },
          { id: "B", text: "香蕉" },
          { id: "C", text: "藍色" },
          { id: "D", text: "桌子" }
        ],
        正確答案: "A",
        提示: [
          "這是一種水果",
          "常見顏色是紅色或綠色",
          "英文單字和 iPhone 有關",
          "不是顏色",
          "答案是 A"
        ],
        工具: { 涂鴉牆: false, 珠算: false }
      });
    } else if (科目 === "數學") {
      out.push({
        id: `math-${i + 1}`,
        科目,
        題型: "應用題",
        題幹: `（示範）小明有 12 顆糖，平均分給 3 個朋友，每人幾顆？（第 ${i + 1} 題）`,
        正確答案: "4",
        提示: [
          "想想除法",
          "12 ÷ 3 = ?",
          "先把 12 平均分成 3 份",
          "每份一樣多",
          "答案是 4"
        ],
        工具: { 涂鴉牆: true, 珠算: true }
      });
    } else {
      out.push({
        id: `other-${i + 1}`,
        科目,
        題型: "是非題",
        題幹: `（示範）太陽從東邊升起。（第 ${i + 1} 題）`,
        選項: [
          { id: "T", text: "是" },
          { id: "F", text: "否" }
        ],
        正確答案: "T",
        提示: [
          "想想日出方向",
          "不是西邊",
          "台灣看到日出在哪？",
          "答案不是否",
          "答案是「是」"
        ],
        工具: { 涂鴉牆: false, 珠算: false }
      });
    }
  }

  return out;
}

// ===== 建立新進度 =====
export function 建立新進度(科目: 科目, 本回合題數 = 20, 提示上限 = 5): 練習進度 {
  const id = `${科目}-${now()}-${Math.random().toString(16).slice(2)}`;
  const t = now();
  return {
    id,
    科目,
    本回合題數,
    目前題號: 0,
    已用秒數: 0,
    是否暫停: false,
    提示上限,
    已用提示: 0,
    答對數: 0,
    答錯數: 0,
    題目清單: 產生示範題目(科目, 本回合題數),
    作答紀錄: [],
    狀態: "進行中",
    建立時間: t,
    更新時間: t
  };
}

// ===== 讀取/寫入 =====
export function 讀取進度(id: string): 練習進度 | null {
  if (typeof window === "undefined") return null;
  return safeParse<練習進度>(localStorage.getItem(keyOf(id)));
}

export function 寫入進度(s: 練習進度) {
  if (typeof window === "undefined") return;
  const next: 練習進度 = { ...s, 更新時間: now() };
  localStorage.setItem(keyOf(next.id), JSON.stringify(next));
}

// ===== 列出所有進度 =====
export function 列出全部進度(): 練習進度[] {
  if (typeof window === "undefined") return [];
  const out: 練習進度[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (!k) continue;
    if (!k.startsWith(KEY_PREFIX)) continue;
    const s = safeParse<練習進度>(localStorage.getItem(k));
    if (s) out.push(s);
  }
  // 新的在前
  out.sort((a, b) => b.更新時間 - a.更新時間);
  return out;
}

export function 列出未完成進度(): 練習進度[] {
  return 列出全部進度().filter((s) => s.狀態 === "進行中");
}

// ===== 刪除/清空 =====
export function 刪除進度(id: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(keyOf(id));
  const active = 取得目前進度id();
  if (active === id) 設定目前進度id(null);
}

export function 清除全部進度() {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(KEY_PREFIX)) keys.push(k);
  }
  keys.forEach((k) => localStorage.removeItem(k));
  設定目前進度id(null);
}

// ===== Active Session（目前續做指向）=====
export function 設定目前進度id(id: string | null) {
  if (typeof window === "undefined") return;
  if (!id) localStorage.removeItem(KEY_ACTIVE);
  else localStorage.setItem(KEY_ACTIVE, id);
}

export function 取得目前進度id(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEY_ACTIVE);
}

// ===== 工具函数 =====
export function 格式化時間(秒數: number) {
  const m = Math.floor(秒數 / 60);
  const s = 秒數 % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function 取得目前題目(s: 練習進度): 題目 {
  return s.題目清單[s.目前題號];
}

export function 是否已作答當前題(s: 練習進度): boolean {
  const q = 取得目前題目(s);
  return s.作答紀錄.some((r) => r.題目id === q.id);
}

// ===== 提示（每回合最多 N 次）=====
// 規則：
// - 點提示才扣次數
// - 提示視窗會由 UI 控制：答對進下一題後才自動消失
export function 取得可用提示(s: 練習進度): string[] {
  const q = 取得目前題目(s);
  return q.提示 ?? [];
}

export function 使用一次提示(s: 練習進度): { next: 練習進度; 顯示提示: string | null; 次數文字: string } {
  const 可用 = 取得可用提示(s);
  if (可用.length === 0) {
    return { next: s, 顯示提示: "此題暫無提示。", 次數文字: `${s.已用提示}/${s.提示上限}` };
  }
  if (s.已用提示 >= s.提示上限) {
    return { next: s, 顯示提示: "提示次數已用完。", 次數文字: `${s.已用提示}/${s.提示上限}` };
  }

  const hintIndex = Math.min(s.已用提示, 可用.length - 1);
  const 顯示提示 = 可用[hintIndex];

  const next: 練習進度 = {
    ...s,
    已用提示: s.已用提示 + 1
  };

  return {
    next,
    顯示提示,
    次數文字: `${next.已用提示}/${next.提示上限}`
  };
}

// ===== 作答提交 =====
// 規則：
// - 不作答不能下一題（UI 必須擋）
// - 答對：0.8~1 秒後自動下一題（UI 控制）
// - 答錯：顯示「很可惜答錯了，再試一次」，不說你選錯
export function 提交答案(
  s: 練習進度,
  使用者答案: string
): {
  next: 練習進度;
  是否正確: boolean;
  訊息: string;
} {
  const q = 取得目前題目(s);

  const 正確答案 = (q.正確答案 ?? "").trim();
  const isCorrect = 使用者答案.trim() === 正確答案;

  // 如果已經作答過同一題，避免重複累加（UI 也應避免）
  const 已存在 = s.作答紀錄.some((r) => r.題目id === q.id);
  if (已存在) {
    return { next: s, 是否正確: isCorrect, 訊息: "此題已作答。" };
  }

  const rec: 作答記錄 = {
    題目id: q.id,
    使用者答案,
    是否正確: isCorrect
  };

  const next: 練習進度 = {
    ...s,
    作答紀錄: [...s.作答紀錄, rec],
    答對數: s.答對數 + (isCorrect ? 1 : 0),
    答錯數: s.答錯數 + (isCorrect ? 0 : 1)
  };

  return {
    next,
    是否正確: isCorrect,
    訊息: isCorrect ? "答對了！請繼續下一題。" : "很可惜答錯了，再試一次。"
  };
}

// ===== 下一題 / 完成 =====
export function 可否前進下一題(s: 練習進度): boolean {
  // 必須已作答當前題才能前進
  return 是否已作答當前題(s);
}

export function 前進下一題(s: 練習進度): 練習進度 {
  // 若已完成或已到最后一题
  if (s.狀態 === "已完成") return s;

  const isLast = s.目前題號 >= s.本回合題數 - 1;
  if (isLast) {
    return { ...s, 狀態: "已完成" };
  }

  return { ...s, 目前題號: s.目前題號 + 1 };
}

// ===== 計時 =====
export function 每秒計時(s: 練習進度): 練習進度 {
  if (s.是否暫停) return s;
  return { ...s, 已用秒數: s.已用秒數 + 1 };
}