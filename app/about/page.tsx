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

export default function AboutPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 10px" }}>
        關於 ai智能學習機
      </h1>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>產品定位</div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            ai智能學習機是一套以「英文／數學」為主的智慧學習系統，支援多裝置（手機、平板、網頁、電腦），
            並可延伸更多學科。題庫內容將全部自行設計開發，避免觸犯版權。
          </div>
        </div>

        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>開發原則</div>
          <ul style={{ margin: 0, paddingLeft: 18, opacity: 0.75, lineHeight: 1.9 }}>
            <li>介面一致：App 與 Web 視覺邏輯一致</li>
            <li>響應式：手機／平板／桌機自適應</li>
            <li>可擴充：模組化新增學科與功能</li>
          </ul>
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