import type { Metadata } from "next";

export const metadata: Metadata = { title: "استيراد المنتجات" };

export default function ImportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
