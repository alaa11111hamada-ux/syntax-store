"use client";

import { useActionState } from "react";
import { redirect } from "next/navigation";
import { updateProfileAction, changePasswordAction, deleteAccountAction, type AccountState } from "@/app/actions/account";

function useProfileForm() {
  return useActionState(updateProfileAction, {} as AccountState);
}

function usePasswordForm() {
  return useActionState(changePasswordAction, {} as AccountState);
}

function useDeleteForm() {
  return useActionState(deleteAccountAction, {} as AccountState);
}

export default function ProfilePage({ user }: { user: { name: string; email: string; phone: string | null } }) {
  const [profileState, profileAction, profilePending] = useProfileForm();
  const [passwordState, passwordAction, passwordPending] = usePasswordForm();
  const [deleteState, deleteAction, deletePending] = useDeleteForm();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-extrabold text-fg">الملف الشخصي</h1>

      {/* تعديل البيانات */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-bold text-fg">بيانات الحساب</h2>
        <form action={profileAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-1">الاسم</label>
            <input
              type="text"
              name="name"
              defaultValue={user.name}
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">الإيميل</label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="w-full rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-muted cursor-not-allowed"
            />
            <p className="mt-1 text-xs text-muted">الإيميل لا يمكن تغييره.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">رقم الموبايل</label>
            <input
              type="tel"
              name="phone"
              defaultValue={user.phone ?? ""}
              placeholder="01xxxxxxxxx"
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {profileState.error && <p className="text-sm text-red-400">{profileState.error}</p>}
          {profileState.ok && <p className="text-sm text-green-400">تم حفظ التعديلات.</p>}

          <button
            type="submit"
            disabled={profilePending}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {profilePending ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </form>
      </section>

      {/* تغيير كلمة السر */}
      <section className="rounded-2xl border border-line bg-surface p-6">
        <h2 className="mb-4 font-bold text-fg">تغيير كلمة السر</h2>
        <form action={passwordAction} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-1">كلمة السر الحالية</label>
            <input
              type="password"
              name="currentPassword"
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">كلمة السر الجديدة</label>
            <input
              type="password"
              name="newPassword"
              minLength={6}
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">تأكيد كلمة السر</label>
            <input
              type="password"
              name="confirmPassword"
              minLength={6}
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          {passwordState.error && <p className="text-sm text-red-400">{passwordState.error}</p>}
          {passwordState.ok && <p className="text-sm text-green-400">تم تغيير كلمة السر.</p>}

          <button
            type="submit"
            disabled={passwordPending}
            className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-50"
          >
            {passwordPending ? "جاري التغيير..." : "تغيير كلمة السر"}
          </button>
        </form>
      </section>

      {/* حذف الحساب */}
      <section className="rounded-2xl border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="mb-2 font-bold text-red-300">حذف الحساب</h2>
        <p className="mb-4 text-sm text-muted">
          بالضغط على حذف الحساب، سيتم حذف جميع بياناتك بشكل دائم ولا يمكن التراجع.
        </p>
        <form action={deleteAction} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-fg mb-1">
              اكتب كلمة السر للتأكيد
            </label>
            <input
              type="password"
              name="password"
              className="w-full rounded-xl border border-line bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-muted focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
          </div>

          {deleteState.error && <p className="text-sm text-red-400">{deleteState.error}</p>}
          {deleteState.ok && (
            <p className="text-sm text-green-400">تم حذف الحساب. جاري التوجيه...</p>
          )}

          <button
            type="submit"
            disabled={deletePending}
            className="rounded-xl border border-red-500/50 bg-red-500/10 px-6 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-50"
          >
            {deletePending ? "جاري الحذف..." : "حذف الحساب نهائياً"}
          </button>
        </form>
      </section>
    </div>
  );
}
