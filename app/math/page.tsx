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

export default function MathPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 10px" }}>
        數學專區
      </h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7, margin: "0 0 16px" }}>
        依學制分級的數學練習區，並支援演算輔助工具（涂鴉牆、珠算）。
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>
            分級練習
          </div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            國小（1–6 年級）／國中（1–3 年級）／高中（1–3 年級）。
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>
            作答模式
          </div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            作答頁將強制橫向（App），並可隱藏輔助工具避免干擾。
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