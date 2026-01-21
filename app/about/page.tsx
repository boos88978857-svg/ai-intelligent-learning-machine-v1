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

export default function AboutPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 900 }}>關於</h1>

      <div style={card}>
        <div style={{ opacity: 0.8, lineHeight: 1.8 }}>
          產品名稱：ai智能學習機
          <br />
          核心：英文 / 數學（未來擴充其他學科與競技場）
          <br />
          特色：續做不中斷、提示限制、可開啟涂鴉牆與珠算輔助
          <br />
          題庫：全部自行設計開發（避免任何版權風險）
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