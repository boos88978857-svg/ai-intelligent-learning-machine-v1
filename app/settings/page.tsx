"use client";

import { useRouter } from "next/navigation";

const card: React.CSSProperties = {
  padding: "18px 16px",
  borderRadius: 18,
  background: "#fff",
  border: "1px solid #e6e6e6"
};

const row: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #f0f0f0"
};

const label: React.CSSProperties = {
  fontWeight: 900
};

const hint: React.CSSProperties = {
  opacity: 0.7,
  fontSize: 14,
  lineHeight: 1.6
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

export default function SettingsPage() {
  const router = useRouter();

  return (
    <main>
      <h1 style={{ fontSize: 30, fontWeight: 900, margin: "0 0 10px" }}>
        設定
      </h1>
      <p style={{ opacity: 0.75, lineHeight: 1.7, marginBottom: 16 }}>
        這裡會放使用者偏好設定（例如音標系統偏好、作答介面偏好等）。
      </p>

      <div style={{ display: "grid", gap: 14 }}>
        <div style={card}>
          <div style={row}>
            <div>
              <div style={label}>音標偏好（預留）</div>
              <div style={hint}>支援兩種音標，點選哪種就播放哪種音。</div>
            </div>
            <div style={{ fontWeight: 900, opacity: 0.6 }}>尚未啟用</div>
          </div>

          <div style={row}>
            <div>
              <div style={label}>介面方向（預留）</div>
              <div style={hint}>
                App / 平板將以橫向為主；網頁維持響應式版面。
              </div>
            </div>
            <div style={{ fontWeight: 900, opacity: 0.6 }}>尚未啟用</div>
          </div>

          <div style={{ paddingTop: 12, opacity: 0.7, lineHeight: 1.7 }}>
            ※ 這頁目前先做框架，後續再接上實際功能。
          </div>
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