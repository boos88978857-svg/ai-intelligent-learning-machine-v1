// app/home/page.tsx
export default function HomePage() {
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e6e6e6",
          borderRadius: 18,
          padding: 20,
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 900 }}>
          🌍 国际语言学习平台
        </h1>

        <p style={{ marginTop: 10, opacity: 0.8, lineHeight: 1.6 }}>
          这是首页入口占位页。  
          之后这里会放：
        </p>

        <ul style={{ marginTop: 12, lineHeight: 1.8 }}>
          <li>学习阶段入口（Level 0 / A1 / A2 / B1…）</li>
          <li>句型 / 会话 / 工作 / 旅游 / 留学</li>
          <li>竞技场（预留）</li>
          <li>AI 对话 / 真人匹配（后续）</li>
        </ul>

        <p style={{ marginTop: 14, fontSize: 13, opacity: 0.6 }}>
          当前版本：Home 占位页
        </p>
      </div>
    </main>
  );
}