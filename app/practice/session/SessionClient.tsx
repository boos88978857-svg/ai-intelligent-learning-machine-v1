"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  取得目前進度id,
  讀取進度,
  寫入進度,
  設定目前進度id,
  刪除進度,
  練習進度,
  取得目前題目,
  每秒計時,
  使用一次提示,
  提交答案,
  可否前進下一題,
  前進下一題,
  格式化時間
import Whiteboard from "../../components/Whiteboard";
} from "../../../lib/session";

const wrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "8px 0"
};

const card: React.CSSProperties = {
  padding: "14px 14px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6"
};

const row: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between"
};

const leftRow: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center"
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #eee",
  background: "#fafafa",
  fontWeight: 900,
  fontSize: 13,
  whiteSpace: "nowrap"
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e5e5e5",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer",
  color: "#111"
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#111",
  borderColor: "#111",
  color: "#fff"
};

const grid2: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1.2fr 0.8fr",
  gap: 14,
  marginTop: 12
};

// 手机网页时自动变一栏，避免要滑太多
const grid2Mobile: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr",
  gap: 14,
  marginTop: 12
};

function useIsNarrow() {
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < 860);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return narrow;
}

export default function SessionClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const narrow = useIsNarrow();

  const [session, setSession] = useState<練習進度 | null>(null);

  // UI 状态
  const [提示內容, set提示內容] = useState<string | null>(null);
  const [提示次數文字, set提示次數文字] = useState<string>("0/0");
  const [作答訊息, set作答訊息] = useState<string | null>(null);
  const [鎖住操作, set鎖住操作] = useState(false);

  // 当前题选择/输入
  const [已選答案, set已選答案] = useState<string>("");
  const [文字答案, set文字答案] = useState<string>("");

const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  const timerRef = useRef<number | null>(null);

  // 读取 session：优先 URL ?id=，否则读 active id
  useEffect(() => {
    const idFromUrl = sp.get("id");
    const id = idFromUrl || 取得目前進度id();
    if (!id) {
      router.replace("/practice");
      return;
    }

    設定目前進度id(id);

    const s = 讀取進度(id);
    if (!s) {
      router.replace("/practice");
      return;
    }

    setSession(s);
    set提示次數文字(`${s.已用提示}/${s.提示上限}`);
  }, [router, sp]);

  // 计时：非暂停才跑
  useEffect(() => {
    if (!session) return;

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (session.是否暫停) return;

    timerRef.current = window.setInterval(() => {
      setSession((prev) => {
        if (!prev) return prev;
        const next = 每秒計時(prev);
        寫入進度(next);
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [session?.id, session?.是否暫停]);

  const q = useMemo(() => {
    if (!session) return null;
    return 取得目前題目(session);
  }, [session]);

  // 每换题时重置：选项/输入/讯息（但提示内容保留：你要求“答对前都停留”）
  useEffect(() => {
    set已選答案("");
    set文字答案("");
    set作答訊息(null);
    set鎖住操作(false);
  }, [session?.目前題號]);

  function back() {
    router.back();
  }

  function togglePause() {
    if (!session) return;
    const next = { ...session, 是否暫停: !session.是否暫停 };
    寫入進度(next);
    setSession(next);
  }

  function clearThis() {
    if (!session) return;
    刪除進度(session.id);
    router.replace("/practice");
  }

  function onHint() {
    if (!session) return;
    const { next, 顯示提示, 次數文字 } = 使用一次提示(session);
    寫入進度(next);
    setSession(next);
    set提示內容(顯示提示);
    set提示次數文字(次數文字);
  }

  function submit() {
    if (!session || !q) return;
    if (鎖住操作) return;

    // 必须作答才可送出
    const answer =
      q.題型 === "選擇題" || q.題型 === "是非題"
        ? 已選答案
        : 文字答案.trim();

    if (!answer) {
      set作答訊息("請先作答後再送出。");
      return;
    }

    const { next, 是否正確, 訊息 } = 提交答案(session, answer);
    寫入進度(next);
    setSession(next);

    // 选中卡片颜色即可，这里不显示“已选取”
    set作答訊息(訊息);

    if (是否正確) {
      set鎖住操作(true);
      // 答对后：提示卡自动消失 + 自动下一题（速度不要太快）
      window.setTimeout(() => {
        setSession((prev) => {
          if (!prev) return prev;
          const moved = 前進下一題(prev);
          寫入進度(moved);

          // 若回合结束：不清提示（下一段会显示完成画面）
          if (moved.狀態 === "已完成") return moved;

          // 下一题开始，提示自动消失
          set提示內容(null);
          set提示次數文字(`${moved.已用提示}/${moved.提示上限}`);
          set鎖住操作(false);
          return moved;
        });
      }, 900);
    }
  }

  function nextQuestion() {
    if (!session) return;
    if (!可否前進下一題(session)) {
      set作答訊息("請先作答後再前進下一題。");
      return;
    }
    const moved = 前進下一題(session);
    寫入進度(moved);
    setSession(moved);

    // 手动下一题也要把提示收掉
    if (moved.狀態 !== "已完成") {
      set提示內容(null);
      set提示次數文字(`${moved.已用提示}/${moved.提示上限}`);
    }
  }

  if (!session || !q) {
    return (
      <main style={wrap}>
        <div style={card}>載入中…</div>
      </main>
    );
  }

  // 回合结束画面
  if (session.狀態 === "已完成") {
    return (
      <main style={wrap}>
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 22, marginBottom: 10 }}>
            本回合完成 ✅
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            <button onClick={() => router.replace("/practice")} style={btnPrimary}>
              回學習區（續做中心）
            </button>
            <button onClick={clearThis} style={btn}>
              清除本回合進度
            </button>
            <button onClick={back} style={btn}>
              ← 回上一頁
            </button>
          </div>
        </div>
      </main>
    );
  }

  const isChoice = q.題型 === "選擇題" || q.題型 === "是非題";
  const showTools = q.工具?.涂鴉牆 || q.工具?.珠算;

  return (
    <main style={wrap}>
      {/* 顶部状态列：你要求把内容尽量压在一页内 */}
      <div style={card}>
        <div style={row}>
          <div style={leftRow}>
            <span style={pill}>科目：{session.科目}</span>
            <span style={pill}>
              第 {session.目前題號 + 1} 題 / {session.本回合題數}
            </span>
            <span style={pill}>⏱ {格式化時間(session.已用秒數)}</span>
            <span style={pill}>對：{session.答對數} / 錯：{session.答錯數}</span>
            <span style={pill}>提示：{提示次數文字}</span>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={togglePause} style={btn}>
              {session.是否暫停 ? "▶ 繼續" : "⏸ 暫停"}
            </button>
            <button onClick={back} style={btn}>
              ← 回上一頁
            </button>
          </div>
        </div>

        {/* 暂停时：保持提示卡即可（你要求不用弹窗） */}
        {session.是否暫停 ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px dashed #ddd", fontWeight: 900 }}>
            已暫停，請點「▶ 繼續」後再作答。
          </div>
        ) : null}
      </div>

      <div style={narrow ? grid2Mobile : grid2}>
        {/* 左：题目+答案 */}
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
            題目
          </div>
          <div style={{ lineHeight: 1.8, opacity: 0.9 }}>{q.題幹}</div>

          <div style={{ marginTop: 14, fontWeight: 900 }}>作答</div>

          {isChoice ? (
            <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
              {(q.選項 ?? []).map((opt) => {
                const selected = 已選答案 === opt.id;
                return (
                  <button
                    key={opt.id}
                    disabled={鎖住操作 || session.是否暫停}
                    onClick={() => set已選答案(opt.id)}
                    style={{
                      textAlign: "left",
                      padding: "12px 12px",
                      borderRadius: 14,
                      border: "1px solid #e5e5e5",
                      background: selected ? "#111" : "#fff",
                      color: selected ? "#fff" : "#111",
                      fontWeight: 900,
                      cursor: "pointer"
                    }}
                  >
                    {opt.id}. {opt.text}
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ marginTop: 10 }}>
              <textarea
                value={文字答案}
                disabled={鎖住操作 || session.是否暫停}
                onChange={(e) => set文字答案(e.target.value)}
                placeholder="請輸入你的答案（示範）"
                style={{
                  width: "100%",
                  minHeight: 110,
                  borderRadius: 14,
                  border: "1px solid #e5e5e5",
                  padding: 12,
                  fontWeight: 700,
                  outline: "none",
                  resize: "vertical"
                }}
              />
              <div style={{ marginTop: 8, opacity: 0.7, lineHeight: 1.7 }}>
                ※ 之後會依題型顯示不同作答區：填空、簡答、應用題、作圖等。
              </div>
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={submit} disabled={鎖住操作 || session.是否暫停} style={btnPrimary}>
              送出答案
            </button>
            <button onClick={nextQuestion} disabled={鎖住操作 || session.是否暫停} style={btn}>
              下一題 →
            </button>
          </div>

          {作答訊息 ? (
            <div style={{ marginTop: 12, fontWeight: 900 }}>
              {作答訊息}
            </div>
          ) : null}
        </div>

        {/* 右：提示卡 + 工具预告 */}
        <div style={card}>
          <div style={{ fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
            提示
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={onHint} disabled={session.是否暫停} style={btnPrimary}>
              顯示提示
            </button>
          </div>

          <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: "1px solid #eee", minHeight: 86 }}>
            {提示內容 ? (
              <div style={{ lineHeight: 1.8, fontWeight: 900 }}>{提示內容}</div>
            ) : (
              <div style={{ opacity: 0.7, lineHeight: 1.7 }}>
                點「顯示提示」後會顯示提示內容（答對前會一直停留）。
              </div>
            )}
          </div>

          {showTools ? (
            <div style={{ marginTop: 14, opacity: 0.75, lineHeight: 1.7 }}>
              ※ 此題需要輔助工具：涂鴉牆 / 珠算（下一阶段加入，可先隐藏，点击才展开，不影响版面）。
            </div>
          ) : (
            <div style={{ marginTop: 14, opacity: 0.75, lineHeight: 1.7 }}>
              ※ 此題不需要輔助工具。
            </div>
          )}

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button onClick={clearThis} style={btn}>
              清除此回合
            </button>
          </div>
        </div>
      </div>

<Whiteboard
  open={whiteboardOpen}
  onClose={() => setWhiteboardOpen(false)}
/>

    </main>
  );
}