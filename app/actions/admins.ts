"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, hashPassword } from "@/lib/auth";
import { isValidEmail, isValidPhone, cleanStr } from "@/lib/validation";
import { getAllPermissionIds, MANAGER_DEFAULT_PERMISSIONS } from "@/lib/permissions";

export type AdminActionResult = {
  ok?: boolean;
  error?: string;
};

/** جلب كل المديرين */
export async function getAdmins() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") return [];

  return prisma.user.findMany({
    where: { role: { in: ["admin", "manager"] } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      blocked: true,
      permissions: true,
      createdAt: true,
      lastLoginAt: true,
      _count: { select: { orders: true } },
    },
  });
}

/** إضافة أدمن جديد */
export async function createAdminAction(
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "مش لديك صلاحية." };
  }

  const name = cleanStr(formData.get("name"), 80);
  const email = cleanStr(formData.get("email"), 120).toLowerCase();
  const phone = cleanStr(formData.get("phone"), 20);
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";
  const role = cleanStr(formData.get("role"), 20) || "admin";

  if (name.length < 2) return { error: "الاسم لازم يكون حرفين على الأقل." };
  if (!isValidEmail(email)) return { error: "الإيميل غير صالح." };
  if (password.length < 6) return { error: "كلمة السر لازم 6 حروف على الأقل." };

  // تحقق من عدم تكرار الإيميل
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "فيه حساب بالإيميل ده بالفعل." };

  // جمع الصلاحيات من checkboxes (للأدمن فقط — المدير الفرعي صلاحياته ثابتة)
  const isManager = role === "manager";
  let permissions: string[];
  if (isManager) {
    permissions = [...MANAGER_DEFAULT_PERMISSIONS];
  } else {
    const allPermissions = getAllPermissionIds();
    permissions = [];
    for (const perm of allPermissions) {
      if (formData.get(`perm_${perm}`) === "on") {
        permissions.push(perm);
      }
    }
  }

  await prisma.user.create({
    data: {
      name,
      email,
      phone: phone || null,
      passwordHash: await hashPassword(password),
      role: isManager ? "manager" : "admin",
      permissions: JSON.stringify(permissions),
    },
  });

  return { ok: true };
}

/** تعديل أدمن */
export async function updateAdminAction(
  adminId: string,
  _prev: AdminActionResult,
  formData: FormData
): Promise<AdminActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "مش لديك صلاحية." };
  }

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) return { error: "المستخدم مش موجود." };

  // منع تعديل نفسه
  if (admin.id === currentUser.id) {
    return { error: "ممكن تعدّل صلاحياتك من إعدادات الحساب." };
  }

  const name = cleanStr(formData.get("name"), 80);
  const phone = cleanStr(formData.get("phone"), 20);
  const role = cleanStr(formData.get("role"), 20) || "admin";
  const password = typeof formData.get("password") === "string" ? (formData.get("password") as string) : "";

  if (name.length < 2) return { error: "الاسم لازم يكون حرفين على الأقل." };

  // جمع الصلاحيات من checkboxes (للأدمن فقط — المدير الفرعي صلاحياته ثابتة)
  const isManager = role === "manager";
  let permissions: string[];
  if (isManager) {
    permissions = [...MANAGER_DEFAULT_PERMISSIONS];
  } else {
    const allPermissions = getAllPermissionIds();
    permissions = [];
    for (const perm of allPermissions) {
      if (formData.get(`perm_${perm}`) === "on") {
        permissions.push(perm);
      }
    }
  }

  const updateData: Record<string, unknown> = {
    name,
    phone: phone || null,
    role: isManager ? "manager" : "admin",
    permissions: JSON.stringify(permissions),
  };

  // تحديث كلمة السر لو اتكتب جديدة
  if (password.length >= 6) {
    updateData.passwordHash = await hashPassword(password);
  }

  await prisma.user.update({ where: { id: adminId }, data: updateData });

  return { ok: true };
}

/** حذف أدمن */
export async function deleteAdminAction(adminId: string): Promise<AdminActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "مش لديك صلاحية." };
  }

  if (adminId === currentUser.id) {
    return { error: "متحذفش حسابك!" };
  }

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) return { error: "المستخدم مش موجود." };

  await prisma.user.delete({ where: { id: adminId } });
  return { ok: true };
}

/** تغيير حالة الحظر */
export async function toggleBlockAdminAction(adminId: string): Promise<AdminActionResult> {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "admin") {
    return { error: "مش لديك صلاحية." };
  }

  if (adminId === currentUser.id) {
    return { error: "متحظرش نفسك!" };
  }

  const admin = await prisma.user.findUnique({ where: { id: adminId } });
  if (!admin) return { error: "المستخدم مش موجود." };

  await prisma.user.update({
    where: { id: adminId },
    data: { blocked: !admin.blocked },
  });

  return { ok: true };
}
