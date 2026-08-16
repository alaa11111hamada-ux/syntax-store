// أدوات تحقّق بسيطة للمدخلات

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** أرقام موبايل مصرية (11 رقم تبدأ بـ 01) أو دولي بسيط */
export function isValidPhone(phone: string): boolean {
  const p = phone.replace(/[\s-]/g, "");
  return /^(01\d{9}|\+?\d{8,15})$/.test(p);
}

export function isNonEmpty(v: unknown, min = 1, max = 500): v is string {
  return typeof v === "string" && v.trim().length >= min && v.trim().length <= max;
}

export function cleanStr(v: FormDataEntryValue | null, max = 500): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
