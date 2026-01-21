import Link from "next/link";

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12
};

const gridMobile: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
  gap: 12
};

const card: React.CSSProperties = {
  padding: "18px 14px",
  borderRadius: 18,
  border: "1px solid #e6e6e6",
  background: "#fff",
  textDecoration: "none",
  color: "#111",
  display: "flex",
  flexDirection: "column",
  gap: 10
};

const title: React.CSSProperties = { fontSize: 18, fontWeight: 900 };
const desc: React.CSSProperties = { opacity: 0.75, lineHeight: 1.7, fontSize: 13 };

export default function HomePage() {
  return (
    <main>
      <h1 style={{ margin: "0 0 10px", fontSize: 30, fontWeight: 900 }}>首頁</h1>
      <p style={{ margin: "0 0 14px", opacity: 0.75, lineHeight: 1.7 }}>
        先把框架入口打通，後續再加入英文學習、分級題庫、涂鴉牆、珠算、競技場等模組。
      </p>

      {/* RWD：手机两栏，网页三栏 */}
      <div style={grid}>
        <Link href="/english" style={card}>
          <div style={title}>英文專區</div>
          <div style={desc}>學習 + 練習（A1~C2 / 多益）</div>
        </Link>

        <Link href="/math" style={card}>
          <div style={title}>數學專區</div>
          <div style={desc}>國小/國中/高中 分級練習</div>
        </Link>

        <Link href="/other" style={card}>
          <div style={title}>其他學科</div>
          <div style={desc}>後續擴充入口</div>
        </Link>

        <Link href="/arena" style={card}>
          <div style={title}>學習競技場</div>
          <div style={desc}>對戰/排行（後續建置）</div>
        </Link>
      </div>

      {/* 小提醒：手机显示不靠 CSS 档，先用说明 */}
      <div style={{ marginTop: 12, opacity: 0.6, lineHeight: 1.7 }}>
        ※ 手機版：卡片會自動換行（之後再做更完整的 RWD 佈局與 3D 科技感視覺）。
      </div>
    </main>
  );
}