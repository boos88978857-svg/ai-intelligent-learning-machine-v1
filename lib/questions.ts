// lib/questions.ts
// ai智能學習機（v1 → P0）題目資料結構：先用自製 mock 題庫，避免任何版權問題

export type 科目 = "英文" | "數學" | "其他";

/** 題型：先做兩種最常用的 */
export type 題型 = "單選題" | "輸入題";

export type 單選題 = {
  id: string;
  subject: 科目;
  type: "單選題";
  prompt: string;          // 題幹
  options: string[];       // 選項（至少 2 個）
  answerIndex: number;     // 正確答案索引
  hints: string[];         // 提示（最多 5 則；用幾次扣幾次）
};

export type 輸入題 = {
  id: string;
  subject: 科目;
  type: "輸入題";
  prompt: string;
  answerText: string;      // 正確答案（字串比對；後續可升級成容錯）
  hints: string[];
};

export type Question = 單選題 | 輸入題;

/** 一回合題數（先固定 20；後續可按關卡/難度調整） */
export const 一回合題數 = 20;

/** 一回合提示次數上限（你要 5 次） */
export const 一回合提示上限 = 5;

/* ========= 自製 Mock 題庫（示範）=========
   注意：全部題目需自行設計，避免任何版權問題
*/
export const 題庫: Question[] = [
  // 英文：單選題（示範）
  {
    id: "en-001",
    subject: "英文",
    type: "單選題",
    prompt: "請選出正確的顏色：Blue 的中文意思是？",
    options: ["紅色", "藍色", "綠色", "黃色"],
    answerIndex: 1,
    hints: [
      "提示 1：這是常見顏色單字。",
      "提示 2：Blue 和 sky（天空）常一起想到。",
      "提示 3：想想「藍天」。",
      "提示 4：排除法：不是紅/綠/黃。",
      "提示 5：答案是「藍色」。",
    ],
  },
  {
    id: "en-002",
    subject: "英文",
    type: "單選題",
    prompt: "請選出正確的水果：Apple 是？",
    options: ["蘋果", "香蕉", "葡萄", "橘子"],
    answerIndex: 0,
    hints: [
      "提示 1：Apple 是非常基本的單字。",
      "提示 2：iPhone 公司也叫 Apple。",
      "提示 3：它是一種常見圓形水果。",
      "提示 4：排除法：不是香蕉/葡萄/橘子。",
      "提示 5：答案是「蘋果」。",
    ],
  },

  // 數學：輸入題（示範）
  {
    id: "ma-001",
    subject: "數學",
    type: "輸入題",
    prompt: "12 ÷ 3 = ?",
    answerText: "4",
    hints: [
      "提示 1：除法就是平均分。",
      "提示 2：想像 12 顆糖分給 3 人。",
      "提示 3：3 × 4 = 12。",
      "提示 4：所以 12 ÷ 3 = 4。",
      "提示 5：答案是 4。",
    ],
  },

  // 其他：先放一題示範
  {
    id: "ot-001",
    subject: "其他",
    type: "單選題",
    prompt: "這是一題示範：請選出「右邊」",
    options: ["左邊", "右邊"],
    answerIndex: 1,
    hints: [
      "提示 1：右邊通常在你面向前方的右手側。",
      "提示 2：把手伸出去比一比。",
      "提示 3：選「右邊」。",
      "提示 4：就是右邊。",
      "提示 5：答案是「右邊」。",
    ],
  },
];

/** 依科目取題：先用最簡單過濾 */
export function 取題(科目: 科目): Question[] {
  return 題庫.filter((q) => q.subject === 科目);
}

/** 取一回合題目：先用前 N 題（後續可改成亂數/按難度） */
export function 取一回合(科目: 科目): Question[] {
  const list = 取題(科目);
  return list.slice(0, 一回合題數);
}