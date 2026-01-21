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