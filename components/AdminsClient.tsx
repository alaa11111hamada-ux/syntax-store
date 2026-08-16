"use client";

import { useState, useActionState } from "react";
import {
  createAdminAction,
  updateAdminAction,
  deleteAdminAction,
  toggleBlockAdminAction,
  type AdminActionResult,
} from "@/app/actions/admins";
import AdminForm from "@/components/AdminForm";
import { parsePermissions } from "@/lib/permissions";
import { formatPrice } from "@/lib/format";

type AdminItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  blocked: boolean;
  permissions: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  _count: { orders: number };
};

export default function AdminsClient({ admins }: { admins: AdminItem[] }) {
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminItem | null>(null);

  const [createState, createFormAction, createPending] = useActionState(
    createAdminAction,
    {} as AdminActionResult
  );
  const [updateState, updateFormAction, updatePending] = useActionState(
    (prev: AdminActionResult, formData: FormData) =>
      editingAdmin ? updateAdminAction(editingAdmin.id, prev, formData) : prev,
    {} as AdminActionResult
  );

  const formatDate = (d: Date | null) =>
    d
      ? new Intl.DateTimeFormat("ar-EG", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }).format(new Date(d))
      : "—";

  function handleAdd() {
    setEditingAdmin(null);
    setShowModal(true);
  }

  function handleEdit(admin: AdminItem) {
    setEditingAdmin(admin);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm("متأكد إنك عايز تحذف الأدمن ده؟")) return;
    const res = await deleteAdminAction(id);
    if (res.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  }

  async function handleToggleBlock(id: string) {
    const res = await toggleBlockAdminAction(id);
    if (res.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  }

  const state = editingAdmin ? updateState : createState;

  return (
    <>
      {/* رأس الصفحة */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-fg">المديرين والأدمن</h2>
        <button
          type="button"
          onClick={handleAdd}
          className="rounded-xl bg-brand-gradient px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-95"
        >
          + إضافة أدمن
        </button>
      </div>

      {/* شرح سريع */}
      <div className="rounded-2xl border border-brand-500/30 bg-brand-500/5 p-4 text-sm text-muted">
        <p>
          <strong className="text-fg">أدمن رئيسي:</strong> لو ما اخترتش أي صلاحية، الأدمن هيكون عنده كل الصلاحيات.
        </p>
        <p className="mt-1">
          <strong className="text-fg">مدير فرعي:</strong> لازم تحدد الصلاحيات بالظبط — هيقدر يشوف ويعمل بس الحاجات اللي اאנרגتها.
        </p>
      </div>

      {/* قائمة المديرين */}
      {admins.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center text-muted">
          لسه مفيش مديرين مضافين.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {admins.map((admin) => {
            const perms = parsePermissions(admin.permissions);
            const isSuperAdmin = admin.role === "admin" && perms.length === 0;
            const permCount = perms.length;

            return (
              <div
                key={admin.id}
                className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-surface p-4 transition-colors ${
                  admin.blocked
                    ? "border-red-500/30 opacity-60"
                    : "border-line hover:border-brand-600/50"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-bold text-fg">
                    {admin.name}
                    {admin.role === "admin" && (
                      <span className="ms-2 rounded-full bg-brand-600/20 px-2 py-0.5 text-xs text-brand-200">
                        أدمن
                      </span>
                    )}
                    {admin.role === "manager" && (
                      <span className="ms-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                        مدير فرعي
                      </span>
                    )}
                    {admin.blocked && (
                      <span className="ms-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-300">
                        محظور
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted">
                    {admin.email}
                    {admin.phone && <span className="tnum"> · {admin.phone}</span>}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted">
                    {isSuperAdmin ? (
                      <span className="rounded-full bg-brand-600/15 px-2 py-0.5 text-brand-200">
                        كل الصلاحيات
                      </span>
                    ) : (
                      <span className="rounded-full bg-surface-2 px-2 py-0.5">
                        {permCount} صلاحية
                      </span>
                    )}
                    <span className="rounded-full bg-surface-2 px-2 py-0.5">
                      انضم {formatDate(admin.createdAt)}
                    </span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5">
                      آخر دخول {formatDate(admin.lastLoginAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(admin)}
                    className="rounded-lg border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:bg-surface-2"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleBlock(admin.id)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      admin.blocked
                        ? "border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                        : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                    }`}
                  >
                    {admin.blocked ? "فك الحظر" : "حظر"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(admin.id)}
                    className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20"
                  >
                    حذف
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* المودال */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-line bg-bg p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-fg">
                {editingAdmin ? "تعديل الأدمن" : "إضافة أدمن جديد"}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setEditingAdmin(null);
                }}
                className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-fg hover:bg-surface-2"
              >
                إلغاء
              </button>
            </div>

            <AdminForm
              admin={editingAdmin ?? undefined}
              mode={editingAdmin ? "edit" : "create"}
              formAction={editingAdmin ? updateFormAction : createFormAction}
              onDelete={handleDelete}
              onToggleBlock={handleToggleBlock}
              pending={editingAdmin ? createPending : updatePending}
              error={state.error}
            />

            {state.ok && (
              <div className="mt-4 rounded-xl border border-green-500/40 bg-green-500/10 px-4 py-3 text-center text-sm text-green-300">
                {editingAdmin ? "تم تعديل الأدمن بنجاح" : "تم إضافة الأدمن بنجاح"}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
