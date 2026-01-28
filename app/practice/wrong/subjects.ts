// app/practice/wrong/subjects.ts

export type WrongSubjectConfig = {
  /** 用於 key（不影響 wrongBook 結構） */
  id: string;
  /** UI 顯示名稱 */
  label: string;
  /** wrong-book 裡 subject 的 key（你目前是 "英文" / "數學" 這種字串） */
  bookKey: string;
};

/**
 * ✅ 之後要加新科目，只要在這裡加一行即可
 * bookKey 必須和 wrong-book 寫入時的 subject 一致
 */
export const WRONG_SUBJECTS: WrongSubjectConfig[] = [
  { id: "english", label: "英文", bookKey: "英文" },
  { id: "math", label: "數學", bookKey: "數學" },
];