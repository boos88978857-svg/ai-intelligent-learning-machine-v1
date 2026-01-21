"use client";

import { useRouter } from "next/navigation";

const card: React.CSSProperties = {
  padding: "18px 16px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6"
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

export default function RecordsPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 10px" }}>
        學習記錄
      </h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7, marginBottom: 16 }}>
        這裡會顯示各科目的學習紀錄、答題歷程與統計數據。
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>
            紀錄內容（預留）
          </div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            未來會顯示：作答次數、正確率、學習時間、成長趨勢。
          </div>
        </div>

        <div style={card}>
          <button onClick={() => router.back()} style={btn}>
            ← 回上一頁
          </button>
        </div>
      </div>
    </main>
  );
}