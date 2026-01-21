"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

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

export default function OtherPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 10px" }}>
        其他學科
      </h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7, margin: "0 0 16px" }}>
        這裡預留給更多科目（例如自然、社會等）。所有題庫內容都會自行設計開發，避免版權問題。
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>科目入口（預留）</div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            後續會依你企劃書新增更多科目與分級內容。
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>續做中心</div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            任何科目做到一半，都能在「學習區」看到未完成進度並續做或清除。
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