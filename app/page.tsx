// app/page.tsx
import { redirect } from "next/navigation";
import { getLangConfig } from "../lib/lang-config";

export default function HomePage() {
  const cfg = getLangConfig();

  // ✅ 第一次进 App：还没选语言 → 去语言选择页
  if (!cfg?.native || !cfg?.learning) {
    redirect("/onboarding");
  }

  // ✅ 已选过语言 → 直接进学习首页
  redirect("/practice");
}