// app/practice/wrong/page.tsx
import React, { Suspense } from "react";
import WrongClient from "./wrong-client";

export default function WrongPage() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>讀取中…</div>}>
      <WrongClient />
    </Suspense>
  );
}