// app/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLangConfig } from "../lib/lang-config";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const cfg = getLangConfig();
    const hasLang = !!cfg?.native && !!cfg?.learning;

    router.replace(hasLang ? "/home" : "/onboarding");
  }, [router]);

  // ✅ 这里随便放一个很轻的加载占位，避免白屏
  return (
    <main style={{ padding: 20, opacity: 0.7 }}>
      Loading…
    </main>
  );
}