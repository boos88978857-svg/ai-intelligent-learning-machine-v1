// app/page.tsx
import GateRedirect from "./GateRedirect";

export default function Page() {
  // ✅ 这里保持 Server Component，不碰 localStorage
  // ✅ 真正判断放到 GateRedirect（client）里做
  return <GateRedirect />;
}