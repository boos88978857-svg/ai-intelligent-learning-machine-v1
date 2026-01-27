// app/practice/wrong/session/page.tsx
import { Suspense } from "react";
import WrongSessionClient from "./wrong-session-client";

export default function WrongSessionPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>載入錯題中…</div>}>
      <WrongSessionClient />
    </Suspense>
  );
}