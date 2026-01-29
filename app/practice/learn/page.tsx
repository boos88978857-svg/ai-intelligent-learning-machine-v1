// app/practice/learn/page.tsx
import PracticeClient from "../PracticeClient";

export default function PracticeLearnPage({
  searchParams,
}: {
  searchParams?: { subject?: string; stage?: string };
}) {
  const subject = searchParams?.subject ?? "";
  const stage = searchParams?.stage ?? "";
  return <PracticeClient subject={subject} stage={stage} />;
}