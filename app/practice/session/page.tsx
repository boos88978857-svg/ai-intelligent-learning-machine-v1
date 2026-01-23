// app/practice/session/page.tsx
import React, { Suspense } from "react";
import SessionClient from "./SessionClient";

export default function PracticeSessionPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>載入中…</div>}>
      <SessionClient />
    </Suspense>
  );
}