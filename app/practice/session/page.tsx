import { Suspense } from "react";
import SessionClient from "./SessionClient";

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 16 }}>Loading...</div>}>
      <SessionClient />
    </Suspense>
  );
}