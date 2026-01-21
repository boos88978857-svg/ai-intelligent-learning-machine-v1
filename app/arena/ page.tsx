"use client";

import { useRouter } from "next/navigation";

const card: React.CSSProperties = {
  padding: "18px 14px",
  borderRadius: 18,
  border: "1px solid #e6e6e6",
  background: "#fff"
};

const btn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e5e5e5",
  background: "#fff",
  fontWeight: 900,
  cursor: "pointer"
};

export default function ArenaPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 900 }}>學習競技場</h1>

      <div style={card}>
        <div style={{ opacity: 0.8, lineHeight: 1.8 }}>
          這裡未來會做：
          <br />• 關卡 / 對戰 / 排行
          <br />• 限時賽 / 任務賽
          <br />• 競技數據與獎勵
          <br />
          目前先保留框架入口。
        </div>

        <div style={{ marginTop: 14 }}>
          <button style={btn} onClick={() => router.back()}>
            ← 回上一頁
          </button>
        </div>
      </div>
    </main>
  );
}