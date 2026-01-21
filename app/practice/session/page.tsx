"use client";

/**
 * 这个档案只负责：
 * - 作为 App Router 的入口
 * - 避免 Next.js prerender / suspense 问题
 * - 真正的作答逻辑放在 SessionClient 里
 */

import dynamic from "next/dynamic";

const SessionClient = dynamic(
  () => import("./SessionClient"),
  { ssr: false }
);

export default function PracticeSessionPage() {
  return <SessionClient />;
}