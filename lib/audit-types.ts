export type AuditLogEntry = {
  id: string;
  userId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: string;
  createdAt: Date;
  user?: { name: string; email: string } | null;
};

export type AuditLogFilters = {
  action?: string;
  entity?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  perPage?: number;
};

export const ACTION_LABELS: Record<string, string> = {
  create: "إنشاء",
  update: "تحديث",
  delete: "حذف",
  status_change: "تغيير الحالة",
  login: "تسجيل دخول",
  logout: "تسجيل خروج",
};

export const ENTITY_LABELS: Record<string, string> = {
  product: "منتج",
  order: "طلب",
  coupon: "كوبون",
  settings: "إعدادات",
  user: "مستخدم",
  review: "تقييم",
  notification: "إشعار",
  page: "صفحة",
};
