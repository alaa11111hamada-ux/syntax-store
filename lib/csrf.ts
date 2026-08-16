import { cookies } from "next/headers";
import { createHmac, randomBytes } from "crypto";

const SECRET = process.env.AUTH_SECRET || "csrf-fallback-secret";
const COOKIE_NAME = "csrf_token";
const FIELD_NAME = "_csrf";

/**
 * إنشاء CSRF token موقّع ووضعه في cookie.
 * يُستخدم في النماذج (Server Actions).
 */
export async function createCsrfToken(): Promise<string> {
  const nonce = randomBytes(16).toString("hex");
  const timestamp = Date.now().toString();
  const payload = `${nonce}.${timestamp}`;
  const signature = createHmac("sha256", SECRET).update(payload).digest("hex");
  const token = `${payload}.${signature}`;

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60, // ساعة واحدة
  });

  return token;
}

/**
 * التحقق من صحة CSRF token.
 * يقارن الـ token المرسل مع الـ token المخزّن في cookie.
 */
export async function verifyCsrfToken(formData: FormData): Promise<boolean> {
  const store = await cookies();
  const cookieToken = store.get(COOKIE_NAME)?.value;
  const formToken = formData.get(FIELD_NAME);

  if (!cookieToken || !formToken || typeof formToken !== "string") {
    return false;
  }

  // مقارنة آمنة ضد Timing Attacks
  if (cookieToken.length !== formToken.length) {
    return false;
  }

  let mismatch = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    mismatch |= cookieToken.charCodeAt(i) ^ formToken.charCodeAt(i);
  }

  return mismatch === 0;
}

/** اسم حقل CSRF في النماذج */
export const CSRF_FIELD = FIELD_NAME;
