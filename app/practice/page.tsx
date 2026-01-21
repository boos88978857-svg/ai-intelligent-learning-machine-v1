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

export default function PracticeHubPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 10px" }}>
        學習區（續做中心）
      </h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7, marginBottom: 16 }}>
        這裡只負責「續做」：避免手機沒電、斷網、閃退造成進度消失。後續會接上多科目未完成列表。
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>目前狀態</div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            續做資料系統（Session）下一步才會加入。
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/" style={btn}>
              回首頁
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