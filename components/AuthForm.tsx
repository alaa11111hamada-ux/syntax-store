"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { loginAction, registerAction, type AuthState } from "@/app/actions/auth";

const initial: AuthState = {};

export default function AuthForm({ next }: { next: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginState, loginFormAction, loginPending] = useActionState(
    loginAction,
    initial
  );
  const [regState, regFormAction, regPending] = useActionState(
    registerAction,
    initial
  );

  const isLogin = mode === "login";
  const state = isLogin ? loginState : regState;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      {/* التبويبات */}
      <div className="mb-6 grid grid-cols-2 rounded-xl border border-line bg-bg p-1">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-lg py-2 text-sm font-bold transition-colors ${
            isLogin ? "bg-brand-gradient text-white" : "text-muted"
          }`}
        >
          دخول
        </button>
        <button
          type="button"
          onClick={() => setMode("register")}
          className={`rounded-lg py-2 text-sm font-bold transition-colors ${
            !isLogin ? "bg-brand-gradient text-white" : "text-muted"
          }`}
        >
          حساب جديد
        </button>
      </div>

      {/* زر Google */}
      <a
        href="/auth/google"
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-line bg-bg px-4 py-3 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {isLogin ? "تسجيل الدخول بـ Google" : "إنشاء حساب بـ Google"}
      </a>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-line" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-surface px-3 text-muted">أو</span>
        </div>
      </div>

      {isLogin ? (
        <form action={loginFormAction} className="flex flex-col gap-4">
          <input type="hidden" name="redirectTo" value={next} />
          <Field label="الإيميل" name="email" type="email" required placeholder="you@example.com" />
          <Field label="كلمة السر" name="password" type="password" required placeholder="••••••" />
          <div className="text-left">
            <Link href="/forgot-password" className="text-xs text-brand-300 hover:underline">
              نسيت كلمة السر؟
            </Link>
          </div>
          {state.error && <ErrorBox msg={state.error} />}
          <Submit pending={loginPending} label="دخول" />
        </form>
      ) : (
        <form action={regFormAction} className="flex flex-col gap-4">
          <input type="hidden" name="redirectTo" value={next} />
          <Field label="الاسم" name="name" required placeholder="اسمك بالكامل" />
          <Field label="الإيميل" name="email" type="email" required placeholder="you@example.com" />
          <Field label="الموبايل (اختياري)" name="phone" inputMode="tel" placeholder="01xxxxxxxxx" />
          <Field label="كلمة السر" name="password" type="password" required placeholder="6 حروف على الأقل" />
          {state.error && <ErrorBox msg={state.error} />}
          <Submit pending={regPending} label="إنشاء الحساب" />
        </form>
      )}

      <p className="mt-4 text-center text-xs text-muted">
        بتسجيلك بتوافق على إن بياناتك تتخزّن عندنا لمتابعة طلباتك.{" "}
        <Link href="/" className="text-brand-300 hover:underline">
          رجوع للمتجر
        </Link>
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required,
  inputMode,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  inputMode?: "tel" | "text" | "email";
}) {
  return (
    <div>
      <label className="block text-sm text-muted" htmlFor={name}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        required={required}
        className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
      />
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
      {msg}
    </p>
  );
}

function Submit({ pending, label }: { pending: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-brand-gradient px-6 py-3 font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
    >
      {pending ? "لحظة…" : label}
    </button>
  );
}
