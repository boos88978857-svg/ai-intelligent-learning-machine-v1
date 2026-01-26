// app/practice/wrong/page.tsx
import React, { Suspense } from "react";
import WrongClient from "./wrong-client";

export default function WrongPage() {
  return (
    <Suspense fallback={<main style={{ maxWidth: 1100, margin: "0 auto", padding: "18px" }}>讀取中…</main>}>
      <WrongClient />
    </Suspense>
  );
}