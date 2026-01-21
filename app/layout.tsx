import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ai智能學習機",
  description: "AI 智能學習機：英文、數學、多學科學習與練習系統"
};

const navWrap: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 50,
  background: "rgba(255,255,255,0.9)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid #eaeaea"
};

const navInner: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "12px 14px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12
};

const brand: React.CSSProperties = {
  fontWeight: 900,
  letterSpacing: 0.2
};

const navRight: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center"
};

const navBtn: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 14,
  border: "1px solid #e5e5e5",
  textDecoration: "none",
  color: "#111",
  fontWeight: 900,
  background: "#fff"
};

const pageWrap: React.CSSProperties = {
  minHeight: "100vh",
  background:
    "radial-gradient(1000px 500px at 20% -10%, rgba(0,0,0,0.06), transparent), radial-gradient(900px 500px at 90% 0%, rgba(0,0,0,0.05), transparent), #fafafa"
};

const mainWrap: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "18px 14px 40px"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body style={pageWrap}>
        <header style={navWrap}>
          <div style={navInner}>
            <div style={brand}>ai智能學習機</div>

            <nav style={navRight}>
              <Link href="/" style={navBtn}>
                首頁
              </Link>
              <Link href="/practice" style={navBtn}>
                學習區
              </Link>
              <Link href="/records" style={navBtn}>
                記錄
              </Link>
              <Link href="/settings" style={navBtn}>
                設定
              </Link>
              <Link href="/about" style={navBtn}>
                關於
              </Link>
            </nav>
          </div>
        </header>

        <main style={mainWrap}>{children}</main>
      </body>
    </html>
  );
}