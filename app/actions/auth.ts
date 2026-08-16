"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
} from "@/lib/auth";
import { isValidEmail, isValidPhone, cleanStr } from "@/lib/validation";
import { checkLoginRate, checkRegisterRate } from "@/lib/rate-limit";

export type AuthState = { error?: string };

function safeRedirect(target: string): string {
  return target.startsWith("/") && !target.startsWith("//") ? target : "/account";
}

export async function registerAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const name = cleanStr(formData.get("name"), 80);
  const email = cleanStr(formData.get("email"), 120).toLowerCase();
  const phone = cleanStr(formData.get("phone"), 20);
  const password = typeof formData.get("password") === "string"
    ? (formData.get("password") as string)
    : "";
  const redirectTo = safeRedirect(cleanStr(formData.get("redirectTo"), 200) || "/account");

  if (!(await checkRegisterRate(email)))
    return { error: "تم تجاوز الحد الأقصى للتسجيل. جرّب بعد شوية." };

  if (name.length < 2) return { error: "اكتب اسمك بشكل صحيح." };
  if (!isValidEmail(email)) return { error: "الإيميل غير صحيح." };
  if (phone && !isValidPhone(phone)) return { error: "رقم الموبايل غير صحيح." };
  if (password.length < 6)
    return { error: "كلمة السر لازم تكون 6 حروف على الأقل." };

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "فيه حساب بالإيميل ده بالفعل. سجّل دخول." };

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash: await hashPassword(password),
      role: "customer",
    },
  });

  await createSession(user.id);
  redirect(redirectTo);
}

export async function loginAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = cleanStr(formData.get("email"), 120).toLowerCase();
  const password = typeof formData.get("password") === "string"
    ? (formData.get("password") as string)
    : "";
  const redirectTo = safeRedirect(cleanStr(formData.get("redirectTo"), 200) || "/account");

  if (!isValidEmail(email) || !password)
    return { error: "ادخل إيميل وكلمة سر صحيحين." };

  if (!(await checkLoginRate(email)))
    return { error: "تم تجاوز الحد الأقصى للمحاولات. انتظر 15 دقيقة." };

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "الإيميل أو كلمة السر غير صحيحة." };
  }

  await createSession(user.id);

  // لو المستخدم أدمن أو مدير فرعي → للوحة التحكم
  if (user.role === "admin" || user.role === "manager") {
    redirect(redirectTo === "/account" ? "/admin" : redirectTo);
  }
  redirect(redirectTo);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
