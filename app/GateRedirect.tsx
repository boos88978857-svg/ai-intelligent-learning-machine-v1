// app/GateRedirect.tsx
"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLangConfig } from "../lib/lang-config";

/**
 * 入口守门员：
 * - 没选过母语/学习语言 -> /onboarding
 * - 已选过 -> /home（你也可以改成 /practice）
 */
export default function GateRedirect() {
  const router = useRouter();

  useEffect(() => {
    try {
      const cfg = getLangConfig(); // ✅ 只在 client 读取 localStorage
      const hasNative = !!cfg?.native;
      const hasLearning = !!cfg?.learning;

      if (!hasNative || !hasLearning) {
        router.replace("/onboarding");
      } else {
        router.replace("/home");
      }
    } catch {
      // localStorage 被挡/异常：一律走 onboarding
      router.replace("/onboarding");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 简单 loading，避免闪画面
  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: 20 }}>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e6e6e6",
          borderRadius: 16,
          padding: 16,
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 18 }}>載入中…</div>
        <div style={{ opacity: 0.7, marginTop: 6, fontSize: 13 }}>
          正在檢查語言設定
        </div>
      </div>
    </main>
  );
}