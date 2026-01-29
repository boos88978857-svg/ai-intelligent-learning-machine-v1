// app/page.tsx
import { redirect } from "next/navigation";

export default function HomePage() {
  // 这里用 middleware/客户端都行，但你现在先用最简单稳定版：直接进 practice
  // practice 页面里再判断要不要跳 onboarding（下一段我会给你）
  redirect("/practice");
}