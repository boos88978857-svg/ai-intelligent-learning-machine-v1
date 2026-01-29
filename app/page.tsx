// app/page.tsx
"use client";

export const dynamic = "force-dynamic";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLangConfig } from "../lib/lang-config";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const cfg = getLangConfig();
    router.replace(cfg.hasChosen ? "/home" : "/onboarding");
  }, [router]);

  return <main style={{ padding: 20, opacity: 0.6 }}>Loading…</main>;
}