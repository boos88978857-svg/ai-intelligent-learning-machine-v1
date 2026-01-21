import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "ai智能學習機",
  description: "ai智能學習機（框架雛形）"
};

const navWrap: React.CSSProperties = {
  position: "sticky",
  top: 0,
  zIndex: 10,
  background: "rgba(255,255,255,0.9)",
  backdropFilter: "blur(10px)",
  borderBottom: "1px solid #eee"
};

const navInner: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "10px 12px",
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
  justifyContent: "space-between"
};

const brand: React.CSSProperties = {
  fontWeight: 900,
  letterSpacing: 0.2
};

const navBtns: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  alignItems: "center"
};

const navBtn: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid #e5e5e5",
  background: "#fff",
  fontWeight: 900,
  color: "#111",
  textDecoration: "none"
};

const page: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
  padding: "14px 12px 40px"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, Arial" }}>
        <header style={navWrap}>
          <div style={navInner}>
            <div style={brand}>ai智能學習機</div>

            <nav style={navBtns}>
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

        <div style={page}>{children}</div>
      </body>
    </html>
  );
}

