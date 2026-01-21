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
  textDecoration: "none",
  color: "#111",
  display: "inline-block"
};

export default function ArenaPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 10px" }}>
        學習競技場
      </h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7, margin: "0 0 16px" }}>
        這裡預留挑戰模式、成就、排行榜等功能。後續會依企劃書逐步完成。
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>挑戰模式（預留）</div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            後續可加入：限時答題、連勝加成、段位系統等。
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>操作</div>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => router.back()} style={btn}>
              ← 回上一頁
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}