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

export default function EnglishPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 900 }}>英文專區</h1>

      <div style={card}>
        <div style={{ opacity: 0.8, lineHeight: 1.8 }}>
          這裡未來會包含：
          <br />• 英文學習（單字/例句/音標 IPA & KK）
          <br />• 分級練習（A1~C2、TOEIC）
          <br />• 出題與作答流程（可續做）
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