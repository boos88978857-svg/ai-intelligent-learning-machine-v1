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

export default function OtherPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 900 }}>其他學科</h1>

      <div style={card}>
        <div style={{ opacity: 0.8, lineHeight: 1.8 }}>
          這裡保留做後續擴充入口（例如：自然、社會等）。
          <br />
          目前先打通頁面與返回流程。
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