// app/onboarding/OnboardingClient.tsx
"use client";

import React from "react";
import LanguageGate from "../components/LanguageGate";

export default function OnboardingClient() {
  // ✅ 选完语言后，进入首页（你后面要改首页结构，也从这里进）
  return <LanguageGate afterPath="/practice" />;
}