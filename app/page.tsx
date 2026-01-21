 import Link from "next/link";

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 18,
  marginTop: 24
};

const card: React.CSSProperties = {
  padding: "26px 22px",
  borderRadius: 20,
  background: "#fff",
  border: "1px solid #e6e6e6",
  textDecoration: "none",
  color: "#111",
  fontWeight: 900,
  lineHeight: 1.6,
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between"
};

const desc: React.CSSProperties = {
  fontWeight: 500,
  opacity: 0.75,
  marginTop: 8
};

export default function HomePage() {
  return (
    <>
      <h1 style={{ fontSize: 34, fontWeight: 900, margin: "0 0 6px" }}>
        歡迎使用 ai智能學習機
      </h1>
      <p style={{ opacity: 0.7, lineHeight: 1.7 }}>
        個人化 AI 學習系統，支援英文、數學與多學科練習。
      </p>

      <div style={grid}>
        <Link href="/english" style={card}>
          <div>
            英文專區
            <div style={desc}>學習 · 練習 · 音標與聽力</div>
          </div>
          <div>進入 →</div>
        </Link>

        <Link href="/math" style={card}>
          <div>
            數學專區
            <div style={desc}>國小 · 國中 · 高中分級練習</div>
          </div>
          <div>進入 →</div>
        </Link>

        <Link href="/other" style={card}>
          <div>
            其他學科
            <div style={desc}>彈性擴充更多學習內容</div>
          </div>
          <div>進入 →</div>
        </Link>

        <Link href="/arena" style={card}>
          <div>
            學習競技場
            <div style={desc}>挑戰模式 · 成就與排行</div>
          </div>
          <div>進入 →</div>
        </Link>
      </div>
    </>
  );
}