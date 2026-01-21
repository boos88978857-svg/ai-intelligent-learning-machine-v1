"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  列出未完成進度,
  刪除進度,
  設定目前進度id,
  練習進度,
  格式化時間
} from "../../lib/session";

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 14
};

const card: React.CSSProperties = {
  padding: "18px 16px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6"
};

const title: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 900,
  margin: "0 0 10px"
};

const pillRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
  marginTop: 10
};

const pill: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  border: "1px solid #eee",
  background: "#fafafa",
  fontWeight: 900,
  fontSize: 13
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

const btnPrimary: React.CSSProperties = {
  ...btn,
  background: "#111",
  borderColor: "#111",
  color: "#fff"
};

function 進度卡({
  s,
  onContinue,
  onClear
}: {
  s: 練習進度;
  onContinue: (id: string) => void;
  onClear: (id: string) => void;
}) {
  return (
    <div style={card}>
      <div style={{ fontWeight: 900, fontSize: 18 }}>{s.科目}（未完成）</div>

      <div style={pillRow}>
        <span style={pill}>第 {s.目前題號 + 1} 題 / {s.本回合題數}</span>
        <span style={pill}>⏱ {格式化時間(s.已用秒數)}</span>
        <span style={pill}>提示：{s.已用提示}/{s.提示上限}</span>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button onClick={() => onContinue(s.id)} style={btnPrimary}>
          繼續 →
        </button>
        <button onClick={() => onClear(s.id)} style={btn}>
          清除
        </button>
      </div>
    </div>
  );
}

export default function PracticeHubPage() {
  const router = useRouter();
  const [list, setList] = useState<練習進度[]>([]);

  useEffect(() => {
    setList(列出未完成進度());
  }, []);

  const hasAny = useMemo(() => list.length > 0, [list]);

  function refresh() {
    setList(列出未完成進度());
  }

  function continueOne(id: string) {
    設定目前進度id(id);
    router.push(`/practice/session?id=${encodeURIComponent(id)}`);
  }

  function clearOne(id: string) {
    刪除進度(id);
    refresh();
  }

  return (
    <main>
      <h1 style={title}>學習區（續做中心）</h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7, margin: "0 0 16px" }}>
        這裡只負責「續做」：你可以同時有多個科目做到一半，全部都會列在這裡，方便繼續或清除。
      </p>

      {hasAny ? (
        <>
          <div style={grid}>
            {list.map((s) => (
              <進度卡 key={s.id} s={s} onContinue={continueOne} onClear={clearOne} />
            ))}
          </div>

          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/" style={btn}>
              回首頁
            </Link>
            <button onClick={() => router.back()} style={btn}>
              ← 回上一頁
            </button>
          </div>
        </>
      ) : (
        <div style={card}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>目前沒有未完成進度</div>
          <div style={{ opacity: 0.75, lineHeight: 1.7 }}>
            後續你會在各科目「選擇階段」後開始作答，做到一半離開也會回到這裡顯示。
            <br />
            目前可先進入 Debug 建立測試進度，再回來查看列表是否正常。
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/practice/debug" style={btnPrimary}>
              前往 Debug 建立測試進度
            </Link>
            <Link href="/" style={btn}>
              回首頁
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}