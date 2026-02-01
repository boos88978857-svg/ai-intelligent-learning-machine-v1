import Link from "next/link";

const wrap: React.CSSProperties = {
  maxWidth: 980,
  margin: "0 auto",
  padding: "18px 14px",
};

const header: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
  marginBottom: 14,
};

const title: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 900,
  marginBottom: 6,
};

const sub: React.CSSProperties = {
  opacity: 0.75,
  fontSize: 13,
  lineHeight: 1.6,
};

const topLinks: React.CSSProperties = {
  display: "flex",
  gap: 10,
  alignItems: "center",
  flexWrap: "wrap",
};

const pillLink: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #e6e6e6",
  background: "#fff",
  fontSize: 13,
  fontWeight: 800,
  textDecoration: "none",
  color: "#111",
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
  padding: 14,
};

const badge: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #eee",
  background: "#fafafa",
  fontWeight: 900,
  fontSize: 12,
  marginBottom: 10,
};

const cTitle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 900,
  marginBottom: 6,
};

const cDesc: React.CSSProperties = {
  opacity: 0.8,
  fontSize: 13,
  lineHeight: 1.6,
  marginBottom: 12,
};

const btn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid #111",
  background: "#111",
  color: "#fff",
  fontWeight: 900,
  textDecoration: "none",
};

function EntryCard(props: {
  badgeText: string;
  title: string;
  desc: string;
  href: string;
  primaryText: string;
}) {
  return (
    <div style={card}>
      <div style={badge}>{props.badgeText}</div>
      <div style={cTitle}>{props.title}</div>
      <div style={cDesc}>{props.desc}</div>
      <Link href={props.href} style={btn}>
        {props.primaryText}
      </Link>
    </div>
  );
}

export default function HomePage() {
  return (
    <main style={wrap}>
      <header style={header}>
        <div>
          <div style={title}>首页</div>
          <div style={sub}>
            这是 Home 入口 Hub。后续这里会放：学习阶段、错题、AI 对话等。
          </div>
        </div>

        <div style={topLinks}>
          <Link href="/settings" style={pillLink}>
            设定
          </Link>
          <Link href="/onboarding" style={pillLink}>
            重新选择语言
          </Link>
        </div>
      </header>

      <div style={grid}>
        <EntryCard
          badgeText="🚀 学习"
          title="学习区"
          desc="进入练习流程（按你选择的学习语言与阶段）。"
          href="/practice"
          primaryText="开始学习 →"
        />

        <EntryCard
          badgeText="📕 错题"
          title="错题本"
          desc="整理并重练你的错题。"
          href="/practice/wrong"
          primaryText="查看错题 →"
        />

        <EntryCard
          badgeText="🛠️ 设置"
          title="学习设定"
          desc="更改母语、学习语言与偏好。"
          href="/settings"
          primaryText="打开设定 →"
        />
      </div>
    </main>
  );
}