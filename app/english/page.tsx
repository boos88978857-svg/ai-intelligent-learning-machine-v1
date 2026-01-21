"use client";

import Link from "next/link";
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
  textDecoration: "none",
  color: "#111",
  display: "inline-block"
};

export default function EnglishPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 10px" }}>
        英文專區
      </h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7, margin: "0 0 16px" }}>
        這裡會包含「學習」與「出題練習」。音標將支援兩種系統，並記憶使用者偏好。
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>學習（課程）</div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            之後會放：字彙、文法、閱讀、聽力、口說練習。
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>練習（出題）</div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            題庫將自行設計開發，避免觸犯任何版權。
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/practice" style={btn}>
              前往學習區（續做）
            </Link>
            <button onClick={() => router.back()} style={btn}>
              ← 回上一頁
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}