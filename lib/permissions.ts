// ═══ صلاحيات الأدمن ═══
// كل صلاحية لها معرّف فريد واسم عربي للعرض

export const PERMISSION_GROUPS = {
  dashboard: {
    label: "نظرة عامة",
    permissions: [
      { id: "dashboard_view", label: "عرض لوحة التحكم" },
    ],
  },
  products: {
    label: "المنتجات",
    permissions: [
      { id: "products_view", label: "عرض المنتجات" },
      { id: "products_create", label: "إضافة منتجات" },
      { id: "products_edit", label: "تعديل المنتجات" },
      { id: "products_delete", label: "حذف المنتجات" },
    ],
  },
  orders: {
    label: "الطلبات",
    permissions: [
      { id: "orders_view", label: "عرض الطلبات" },
      { id: "orders_edit", label: "تعديل الطلبات وتغيير الحالة" },
      { id: "orders_delete", label: "حذف الطلبات" },
    ],
  },
  customers: {
    label: "العملاء",
    permissions: [
      { id: "customers_view", label: "عرض العملاء" },
      { id: "customers_edit", label: "تعديل بيانات العملاء" },
      { id: "customers_block", label: "حظر/فك حظر العملاء" },
    ],
  },
  coupons: {
    label: "أكواد الخصم",
    permissions: [
      { id: "coupons_view", label: "عرض أكواد الخصم" },
      { id: "coupons_create", label: "إضافة أكواد خصم" },
      { id: "coupons_edit", label: "تعديل أكواد الخصم" },
      { id: "coupons_delete", label: "حذف أكواد الخصم" },
    ],
  },
  tickets: {
    label: "التذاكر والدعم الفني",
    permissions: [
      { id: "tickets_view", label: "عرض التذاكر" },
      { id: "tickets_reply", label: "الرد على التذاكر" },
    ],
  },
  settings: {
    label: "الإعدادات",
    permissions: [
      { id: "settings_view", label: "عرض الإعدادات" },
      { id: "settings_edit", label: "تعديل الإعدادات" },
    ],
  },
  admins: {
    label: "إدارة المديرين",
    permissions: [
      { id: "admins_view", label: "عرض المديرين" },
      { id: "admins_create", label: "إضافة مديرين جدد" },
      { id: "admins_edit", label: "تعديل صلاحيات المديرين" },
      { id: "admins_delete", label: "حذف المديرين" },
    ],
  },
  reports: {
    label: "التقارير",
    permissions: [
      { id: "reports_view", label: "عرض التقارير" },
    ],
  },
  audit: {
    label: "سجل التدقيق",
    permissions: [
      { id: "audit_view", label: "عرض سجل التدقيق" },
    ],
  },
  backup: {
    label: "النسخ الاحتياطي",
    permissions: [
      { id: "backup_view", label: "عرض النسخ الاحتياطي" },
      { id: "backup_create", label: "إنشاء نسخ احتياطية" },
    ],
  },
} as const;

export type Permission = string;

/** كل الصلاحيات الممكنة (مسطّحة) */
export function getAllPermissionIds(): string[] {
  return Object.values(PERMISSION_GROUPS).flatMap((g) =>
    g.permissions.map((p) => p.id)
  );
}

/** تحليل صلاحيات المستخدم من JSON */
export function parsePermissions(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** تحقق: هل لدى المستخدم الصلاحية؟ */
export function hasPermission(userPermissions: string[], permission: string): boolean {
  return userPermissions.includes(permission);
}

/** تحقق: هل لدى المستخدم أي صلاحية من مجموعة؟ */
export function hasAnyPermission(userPermissions: string[], permissions: string[]): boolean {
  return permissions.some((p) => userPermissions.includes(p));
}

/** تحقق: هل لدى المستخدم كل الصلاحيات المطلوبة؟ */
export function hasAllPermissions(userPermissions: string[], permissions: string[]): boolean {
  return permissions.every((p) => userPermissions.includes(p));
}

/** الصلاحيات الافتراضية للادمن الرئيسي (كل الصلاحيات) */
export function getSuperAdminPermissions(): string[] {
  return getAllPermissionIds();
}

/** الصلاحيات الثابتة للمدير الفرعي (لا تتغير ولا تُعدّل) */
export const MANAGER_DEFAULT_PERMISSIONS: readonly string[] = [
  "dashboard_view",
  "orders_view",
  "orders_edit",
  "tickets_view",
  "tickets_reply",
] as const;

/** هل الادمن "رئيسي" (role=admin بدون قيود صلاحيات) */
export function isSuperAdmin(role: string, permissions: string[]): boolean {
  return role === "admin" && permissions.length === 0;
}

/** جلب الصلاحيات الفعلية بناءً على الدور */
export function getEffectivePermissions(role: string, permissions: string[]): string[] {
  if (role === "admin" && permissions.length === 0) {
    // أدمن رئيسي — كل الصلاحيات
    return getAllPermissionIds();
  }
  if (role === "manager") {
    // مدير فرعي — الصلاحيات الثابتة دائمًا
    return [...MANAGER_DEFAULT_PERMISSIONS];
  }
  return permissions;
}

/** مapping من مسارات الصفحات للصلاحية المطلوبة للقراءة */
export const ROUTE_PERMISSIONS: Record<string, string> = {
  "/admin": "dashboard_view",
  "/admin/products": "products_view",
  "/admin/products/analytics": "products_view",
  "/admin/orders": "orders_view",
  "/admin/tickets": "tickets_view",
  "/admin/coupons": "coupons_view",
  "/admin/customers": "customers_view",
  "/admin/users": "customers_view",
  "/admin/admins": "admins_view",
  "/admin/reports": "reports_view",
  "/admin/backup": "backup_view",
  "/admin/audit": "audit_view",
  "/admin/settings": "settings_view",
};
