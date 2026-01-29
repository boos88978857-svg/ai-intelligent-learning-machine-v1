// app/page.tsx
import { redirect } from "next/navigation";
import { getLangConfig } from "../lib/lang-config";

export default function RootPage() {
  const cfg = getLangConfig();

  // 没选过母语或学习语言 → 强制 onboarding
  if (!cfg?.native || !cfg?.learning) {
    redirect("/onboarding");
  }

  // 已完成语言选择 → 进入首页
  redirect("/home");
}