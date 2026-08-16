import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthForm from "@/components/AuthForm";

export const metadata: Metadata = { title: "دخول / حساب جديد" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ next?: string }> };

function safeNext(next?: string): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const target = safeNext(next);

  // لو مسجّل دخول بالفعل، نوديه على طول
  const user = await getCurrentUser();
  if (user) redirect(target);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="mb-6 text-center text-2xl font-extrabold text-fg">
        أهلاً بيك 👋
      </h1>
      <AuthForm next={target} />
    </div>
  );
}
