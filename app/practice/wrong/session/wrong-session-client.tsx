// app/practice/wrong/session/wrong-session-client.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * 錯題重練入口 Client
 *
 * 職責只有一個：
 * - 從 URL 讀 subject / stage
 * - 轉跳到 /practice/session（錯題模式）
 *
 * ❌ 不 render SessionClient
 * ❌ 不自己組 questions
 */
export default function WrongSessionClient() {
  const router = useRouter();
  const search = useSearchParams();

  const subject = search.get("subject");
  const stage = search.get("stage");

  useEffect(() => {
    if (!subject || !stage) {
      // 參數不完整 → 回錯題本
      router.replace("/practice/wrong");
      return;
    }

    // ✅ 關鍵：用 URL 告訴 SessionClient 這是「錯題模式」
    router.replace(
      `/practice/session?wrong=1&subject=${encodeURIComponent(
        subject
      )}&stage=${encodeURIComponent(stage)}`
    );
  }, [router, subject, stage]);

  // 這個頁面不顯示任何 UI，只負責導向
  return null;
}