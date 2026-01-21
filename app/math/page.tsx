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

export default function MathPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 900 }}>數學專區</h1>

      <div style={card}>
        <div style={{ opacity: 0.8, lineHeight: 1.8 }}>
          這裡未來會包含：
          <br />• 國小（小1~小6）
          <br />• 國中（國1~國3）
          <br />• 高中（高1~高3）
          <br />• 作答頁含：提示、涂鴉牆、珠算（可隱藏點開）
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