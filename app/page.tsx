"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { hasLangConfig } from "../lib/lang-config";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasLangConfig() ? "/home" : "/onboarding");
  }, [router]);

  return <main style={{ padding: 20, opacity: 0.6 }}>Loading…</main>;
}