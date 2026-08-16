"use client";

import { useState, useRef } from "react";
import { PERMISSION_GROUPS, MANAGER_DEFAULT_PERMISSIONS, type Permission } from "@/lib/permissions";

type AdminData = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  permissions: string;
  blocked: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
};

type Props = {
  admin?: AdminData;
  mode: "create" | "edit";
  formAction: (formData: FormData) => void;
  onDelete?: (id: string) => void;
  onToggleBlock?: (id: string) => void;
  pending?: boolean;
  error?: string;
};

export default function AdminForm({
  admin,
  mode,
  formAction,
  onDelete,
  onToggleBlock,
  pending,
  error,
}: Props) {
  const [selectedPerms, setSelectedPerms] = useState<string[]>(() => {
    if (!admin) return [];
    try {
      const parsed = JSON.parse(admin.permissions);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [showPerms, setShowPerms] = useState(false);
  const [role, setRole] = useState(admin?.role || "admin");
  const formRef = useRef<HTMLFormElement>(null);

  function togglePerm(permId: string) {
    setSelectedPerms((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  }

  function toggleGroup(groupPerms: string[]) {
    const allSelected = groupPerms.every((p) => selectedPerms.includes(p));
    if (allSelected) {
      setSelectedPerms((prev) => prev.filter((p) => !groupPerms.includes(p)));
    } else {
      setSelectedPerms((prev) => [...new Set([...prev, ...groupPerms])]);
    }
  }

  function selectAll() {
    const all = Object.values(PERMISSION_GROUPS).flatMap((g) =>
      g.permissions.map((p) => p.id)
    );
    setSelectedPerms(all);
  }

  function clearAll() {
    setSelectedPerms([]);
  }

  const permGroups = Object.entries(PERMISSION_GROUPS);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {/* بيانات الحساب */}
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="mb-4 font-bold text-fg">بيانات الحساب</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-muted" htmlFor="admin-name">
              الاسم <span className="text-red-400">*</span>
            </label>
            <input
              id="admin-name"
              name="name"
              type="text"
              defaultValue={admin?.name ?? ""}
              required
              placeholder="اسم الأدمن"
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm text-muted" htmlFor="admin-email">
              الإيميل <span className="text-red-400">*</span>
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              defaultValue={admin?.email ?? ""}
              required
              disabled={mode === "edit"}
              placeholder="admin@example.com"
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500 disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-sm text-muted" htmlFor="admin-phone">
              رقم الموبايل
            </label>
            <input
              id="admin-phone"
              name="phone"
              type="tel"
              defaultValue={admin?.phone ?? ""}
              placeholder="01xxxxxxxxx"
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm text-muted" htmlFor="admin-password">
              كلمة السر {mode === "create" && <span className="text-red-400">*</span>}
              {mode === "edit" && <span className="text-xs">(اتركها فاضية لو مش عايز تغيّرها)</span>}
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              required={mode === "create"}
              minLength={6}
              placeholder={mode === "edit" ? "اتركها فاضية للحفاظ عليها" : "6 حروف على الأقل"}
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm text-muted" htmlFor="admin-role">
              النوع
            </label>
            <select
              id="admin-role"
              name="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-bg px-3 py-2 text-fg outline-none focus:border-brand-500"
            >
              <option value="admin">أدمن</option>
              <option value="manager">مدير فرعي</option>
            </select>
          </div>
        </div>
      </div>

      {/* الصلاحيات */}
      {role === "manager" ? (
        <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-5">
          <h3 className="mb-3 font-bold text-fg">
            الصلاحيات
            <span className="ms-2 text-xs text-blue-300">(ثابتة — لا يمكن تعديلها)</span>
          </h3>
          <div className="flex flex-wrap gap-2">
            {MANAGER_DEFAULT_PERMISSIONS.map((perm) => {
              const group = Object.values(PERMISSION_GROUPS).find((g) =>
                g.permissions.some((p) => p.id === perm)
              );
              const permDef = group?.permissions.find((p) => p.id === perm);
              return (
                <span
                  key={perm}
                  className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200"
                >
                  {permDef?.label || perm}
                </span>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-bold text-fg">
              الصلاحيات
              {selectedPerms.length === 0 && (
                <span className="ms-2 text-xs text-muted">(أدمن رئيسي — كل الصلاحيات)</span>
              )}
            </h3>
            <button
              type="button"
              onClick={() => setShowPerms(!showPerms)}
              className="rounded-lg border border-line bg-bg px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:bg-surface-2"
            >
              {showPerms ? "إخفاء" : "إظهار الصلاحيات"}
            </button>
          </div>

          {showPerms && (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded-lg bg-brand-600/20 px-3 py-1.5 text-xs font-semibold text-brand-200 transition-colors hover:bg-brand-600/30"
                >
                  اختيار الكل
                </button>
                <button
                  type="button"
                  onClick={clearAll}
                  className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/30"
                >
                  إلغاء الكل
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {permGroups.map(([groupKey, group]) => {
                  const groupPermIds = group.permissions.map((p) => p.id);
                  const selectedCount = groupPermIds.filter((p) =>
                    selectedPerms.includes(p)
                  ).length;
                  const allSelected = selectedCount === groupPermIds.length;

                  return (
                    <div
                      key={groupKey}
                      className="rounded-xl border border-line bg-bg p-4"
                    >
                      <label className="mb-3 flex cursor-pointer items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleGroup(groupPermIds)}
                          className="h-4 w-4 accent-brand-600"
                        />
                        <span className="font-bold text-fg">{group.label}</span>
                        <span className="text-xs text-muted">
                          ({selectedCount}/{groupPermIds.length})
                        </span>
                      </label>
                      <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                        {group.permissions.map((perm) => (
                          <label
                            key={perm.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-surface-2"
                          >
                            <input
                              type="checkbox"
                              name={`perm_${perm.id}`}
                              checked={selectedPerms.includes(perm.id)}
                              onChange={() => togglePerm(perm.id)}
                              className="h-3.5 w-3.5 accent-brand-600"
                            />
                            <span className="text-fg">{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* أزرار */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl bg-brand-gradient px-6 py-3 font-bold text-white transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending
            ? mode === "create"
              ? "جاري الإضافة…"
              : "جاري الحفظ…"
            : mode === "create"
              ? "إضافة الأدمن"
              : "حفظ التعديلات"}
        </button>

        {mode === "edit" && admin && (
          <>
            <button
              type="button"
              onClick={() => onToggleBlock?.(admin.id)}
              className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                admin.blocked
                  ? "border-green-500/40 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                  : "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
              }`}
            >
              {admin.blocked ? "فك الحظر" : "حظر"}
            </button>
            <button
              type="button"
              onClick={() => onDelete?.(admin.id)}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-500/20"
            >
              حذف
            </button>
          </>
        )}
      </div>
    </form>
  );
}
