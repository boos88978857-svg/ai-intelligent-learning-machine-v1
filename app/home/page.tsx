// app/home/page.tsx
import Link from "next/link";

const wrap: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "18px 14px",
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 900,
  letterSpacing: 0.3,
};

const sub: React.CSSProperties = {
  opacity: 0.7,
  fontSize: 13,
  marginTop: 6,
  lineHeight: 1.6,
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
};

const card: React.CSSProperties = {
  border: "1px solid #e6e6e6",
  borderRadius: 18,
  background: "#fff",
  padding: 16,
};

const cardTop: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  marginBottom: 10,
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fafafa",
  fontSize: 12,
  fontWeight: 800,
};

const cardTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 6,
};

const cardDesc: React.CSSProperties = {
  opacity: 0.75,
  fontSize: 13,
  lineHeight: 1.6,
  marginBottom: 12,
};

const actions: React.CSSProperties = {
  display: "flex",
  gap: 10,
  flexWrap: "wrap",
  alignItems: "center",
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #ddd",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 900,
  textDecoration: "none",
  color: "#111",
};

const btnPrimary: React.CSSProperties = {
  ...btn,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
};

function EntryCard(props: {
  badgeText: string;
  title: string;
  desc: string;
  href: string;
  primaryText?: string;
  secondaryHref?: string;
  secondaryText?: string;
}) {
  const {
    badgeText,
    title,
    desc,
    href,
    primaryText = "进入 →",
    secondaryHref,
    secondaryText,
  } = props;

  return (
    <section style={card}>
      <div style={cardTop}>
        <span style={badge}>{badgeText}</span>
      </div>

      <div style={cardTitle}>{title}</div>
      <div style={cardDesc}>{desc}</div>

      <div style={actions}>
        <Link href={href} style={btnPrimary}>
          {primaryText}
        </Link>

        {secondaryHref && secondaryText ? (
          <Link href={secondaryHref} style={btn}>
            {secondaryText}
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <main style={wrap}>
      <header style={header}>
        <div>
          <div style={title}>Home</div>
          <div style={sub}>
            这里是学习入口总览：先从「学习区」开始练习；错题会自动进入「错题本」。
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/settings" style={btn}>
            设定
          </Link>
          <Link href="/onboarding" style={btn}>
            重新选择语言
          </Link>
        </div>
      </header>

      type EntryCardProps = {
  badgeText: string;
  title: string;
  desc: string;
  href: string;
  primaryText: string;
};

function EntryCard({ badgeText, title, desc, href, primaryText }: EntryCardProps) {
  return (
    <Link href={href} style={card}>
      <div style={badge}>{badgeText}</div>
      <div style={{ fontSize: 18, fontWeight: 900, marginTop: 8 }}>{title}</div>
      <div style={{ opacity: 0.75, marginTop: 6, lineHeight: 1.6, fontSize: 13 }}>{desc}</div>
      <div style={cta}>{primaryText}</div>
    </Link>
  );
}
    </main>
  );
}