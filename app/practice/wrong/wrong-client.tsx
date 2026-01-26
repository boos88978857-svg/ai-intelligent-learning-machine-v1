// app/practice/wrong/wrong-client.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { getQuestionById, type Question } from "../session/question-bank";

/** ===== UI ===== */
const wrap: React.CSSProperties = { maxWidth: 1100, margin: "0 auto", padding: "8px 0" };

const card: React.CSSProperties = {
  padding: "14px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6",
};

const row: React.CSSProperties = { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" };

const pill: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 12,
  whiteSpace: "nowrap",
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

/** ===== 重練規則 ===== */
const HINT_LIMIT_WRONG = 3; // ✅ 重練：每題 3 次提示

/** ===== 用動態 import 避免你 lib/session 版本不同造成編譯錯 ===== */
async function withSessionLib<T>(fn: (m: any) => T | Promise<T>) {
  const m = await import("../../../lib/session");
  return fn(m);
}

/** ===== 錯題本：讀取/移除（做多版本相容） ===== */
async function readWrongIds(): Promise<string[]> {
  // 1) 先試你的 lib/session（各版本命名都兼容）
  try {
    const ids = await withSessionLib((m) => {
      const getFn =
        m.取得錯題本 ||
        m.getWrongBook ||
        m.getWrongIds ||
        m.讀取錯題本 ||
        m.readWrongBook;

      if (getFn) return getFn();

      // 2) fallback：localStorage（如果你的舊版用這個）
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("wrong_ids");
        return raw ? JSON.parse(raw) : [];
      }
      return [];
    });

    return Array.isArray(ids) ? ids : [];
  } catch {
    // fallback：localStorage
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("wrong_ids");
      return raw ? JSON.parse(raw) : [];
    }
    return [];
  }
}

async function removeWrongId(id: string): Promise<void> {
  try {
    await withSessionLib((m) => {
      const rm =
        m.移除錯題 ||
        m.removeWrong ||
        m.removeWrongId ||
        m.刪除錯題 ||
        m.deleteWrong;

      if (rm) {
        rm(id);
        return;
      }

      // fallback：localStorage
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("wrong_ids");
        const list: string[] = raw ? JSON.parse(raw) : [];
        const next = list.filter((x) => x !== id);
        window.localStorage.setItem("wrong_ids", JSON.stringify(next));
      }
    });
  } catch {
    // fallback：localStorage
    if (typeof window !== "undefined") {
      const raw = window.localStorage.getItem("wrong_ids");
      const list: string[] = raw ? JSON.parse(raw) : [];
      const next = list.filter((x) => x !== id);
      window.localStorage.setItem("wrong_ids", JSON.stringify(next));
    }
  }
}

export default function WrongClient() {
  const router = useRouter();

  const [ids, setIds] = useState<string[]>([]);
  const [pos, setPos] = useState(0);

  const [picked, setPicked] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // ✅ 每題提示 3 次（重練專用，與主學習區無關）
  const [hintUsed, setHintUsed] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);

  const [judging, setJudging] = useState(false);
  const timerRef = useRef<number | null>(null);

  async function reload() {
    const list = await readWrongIds();
    setIds(list);
    setPos((p) => (list.length === 0 ? 0 : Math.min(p, list.length - 1)));
  }

  useEffect(() => {
    reload();
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentId = useMemo(() => ids[pos] ?? null, [ids, pos]);
  const q: Question | null = useMemo(() => (currentId ? getQuestionById(currentId) : null), [currentId]);

  // 切題時重置本題狀態
  useEffect(() => {
    setPicked(null);
    setMsg(null);
    setHintUsed(0);
    setHintText(null);
    setJudging(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, [currentId]);

  const canHint = hintUsed < HINT_LIMIT_WRONG;

  function onPick(choice: string) {
    if (judging) return;
    setPicked(choice);
    setMsg(null);
  }

  function onHint() {
    if (!q) return;
    if (!canHint) {
      setHintText("提示次數已用完（本題 3 次）。");
      return;
    }
    const nextUsed = hintUsed + 1;
    setHintUsed(nextUsed);

    // ✅ 不露正解：只给“理解题意/方向”，优先用题库 hint
    if (q.hint) setHintText(q.hint);
    else setHintText("提示：先看題幹關鍵字，再用排除法縮小選項。");
  }

  async function onConfirm() {
    if (!q) return;
    if (!picked) {
      setMsg("請先選擇一個答案，再按「確定」。");
      return;
    }
    if (judging) return;

    setJudging(true);

    const isCorrect = picked === q.answer;

    if (isCorrect) {
      setMsg("✅ 正確！此題將從錯題本移除。");

      // ✅ 答對：移除錯題，1.2 秒後載入下一題
      await removeWrongId(q.id);

      if (timerRef.current) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(async () => {
        await reload();
        setJudging(false);
      }, 1200);
    } else {
      // ✅ 答錯：不顯示正解、不自動下一題，讓使用者可以改選再試
      setMsg("❌ 不正確。你可以再選一次，或先使用提示（每題 3 次）。");
      setJudging(false);
    }
  }

  function onSkipNext() {
    if (ids.length === 0) return;
    setPos((p) => (p + 1) % ids.length);
  }

  if (ids.length === 0) {
    return (
      <main style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 26 }}>錯題本</div>
          <div style={{ opacity: 0.75, lineHeight: 1.8, marginTop: 8 }}>目前沒有錯題。去做題後再回來重練。</div>
          <div style={{ height: 12 }} />
          <button style={btnPrimary} onClick={() => router.replace("/practice")}>
            ← 回學習區
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={wrap}>
      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, fontSize: 26 }}>錯題本</div>
          <button style={btn} onClick={() => router.replace("/practice")}>
            ← 回學習區
          </button>
        </div>

        <div style={{ height: 10 }} />

        <div style={row}>
          <span style={pill}>
            進度：{pos + 1}/{ids.length}
          </span>
          {q ? (
            <>
              <span style={pill}>{q.subject}</span>
              <span style={pill}>{q.stage}</span>
            </>
          ) : (
            <span style={pill}>（此題題庫找不到，可能已被移除）</span>
          )}
          <button style={btn} onClick={onSkipNext}>
            下一題 →
          </button>
        </div>
      </div>

      <div style={{ height: 10 }} />

      {/* 題目卡：不顯示正解 */}
      <div style={card}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>題目</div>

        <div style={{ opacity: 0.95, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
          {q ? q.prompt : "⚠️ 題庫中找不到這題，可能題庫更新或 ID 不一致。請按「下一題」。"}
        </div>

        <div style={{ height: 12 }} />

        {/* 選項 */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {(q?.choices ?? []).map((c) => {
            const active = picked === c;
            return (
              <button
                key={c}
                style={{
                  ...btn,
                  textAlign: "left",
                  border: active ? "1px solid #111" : "1px solid #ddd",
                  opacity: judging ? 0.6 : 1,
                }}
                onClick={() => onPick(c)}
                disabled={judging}
              >
                {c}
              </button>
            );
          })}
        </div>

        <div style={{ height: 12 }} />

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button style={{ ...btnPrimary, opacity: judging ? 0.6 : 1 }} onClick={onConfirm} disabled={judging}>
            確定
          </button>

          <button style={{ ...btn, opacity: canHint ? 1 : 0.5 }} onClick={onHint} disabled={!canHint}>
            顯示提示
          </button>

          <span style={pill}>
            {hintUsed}/{HINT_LIMIT_WRONG}
          </span>
        </div>

        {/* 提示内容 */}
        <div style={{ marginTop: 10, padding: 12, borderRadius: 12, border: "1px dashed #e0e0e0", opacity: hintText ? 1 : 0.7 }}>
          {hintText ? hintText : "提示可在作答前使用，幫助理解題目（每題 3 次）。"}
        </div>

        {/* 反馈讯息 */}
        {msg ? <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "#f5f5f5" }}>{msg}</div> : null}
      </div>
    </main>
  );
}