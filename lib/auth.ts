import "server-only";
import { cache } from "react";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { parsePermissions, hasPermission, ROUTE_PERMISSIONS, getEffectivePermissions } from "@/lib/permissions";

const COOKIE_NAME = "session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 يوم

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET غير مضبوط في متغيرات البيئة");
  }
  return new TextEncoder().encode(secret);
}

// ===== كلمة السر =====
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ===== الجلسة (JWT داخل httpOnly cookie) =====
async function signSession(userId: string): Promise<string> {
  return new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());
}

export async function createSession(userId: string): Promise<void> {
  const token = await signSession(userId);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  blocked: boolean;
  permissions: string[];
};

/** المستخدم الحالي من الجلسة، أو null لو مش مسجّل دخول */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    const uid = payload.uid as string | undefined;
    if (!uid) return null;
    const user = await prisma.user.findUnique({ where: { id: uid } });
    if (!user || user.blocked) return null;
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      blocked: user.blocked,
      permissions: getEffectivePermissions(user.role, parsePermissions(user.permissions)),
    };
  } catch {
    return null; // توكن غير صالح/منتهي
  }
});

/** يتطلّب أدمن أو مدير فرعي — يحوّل لصفحة الدخول لو مش مسجّل */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (user.role !== "admin" && user.role !== "manager") redirect("/");
  return user;
}

/**
 * تحقق من صلاحية محددة — يحوّل للوحة التحكم لو مافيش صلاحية
 * للادمن الرئيسي (role=admin بدون permissions) — كل الصلاحيات متاحة
 * للمدير الفرعي — الصلاحيات الثابتة دائمًا
 */
export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireAdmin();
  const effective = getEffectivePermissions(user.role, user.permissions);
  if (!effective.includes(permission)) {
    redirect("/admin");
  }
  return user;
}

/**
 * تحقق من صلاحية بناءً على المسار — يحوّل لو مافيش صلاحية
 */
export async function requireRoutePermission(pathname: string): Promise<SessionUser> {
  const user = await requireAdmin();
  const requiredPermission = ROUTE_PERMISSIONS[pathname];
  if (!requiredPermission) return user;
  const effective = getEffectivePermissions(user.role, user.permissions);
  if (!effective.includes(requiredPermission)) {
    redirect("/admin");
  }
  return user;
}

// ===== Google OAuth =====
export async function getGoogleAuthUrl(): Promise<string> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/google`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function handleGoogleCallback(code: string): Promise<void> {
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const callbackUrl = process.env.GOOGLE_CALLBACK_URL || `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/google`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) throw new Error("Failed to exchange Google code for tokens");
  const tokenData = await tokenRes.json();

  // Get user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userRes.ok) throw new Error("Failed to fetch Google user info");
  const googleUser = await userRes.json();

  const email = googleUser.email?.toLowerCase();
  if (!email) throw new Error("Google account has no email");

  const name = googleUser.name || email.split("@")[0];
  const avatar = googleUser.picture || null;

  // Find or create user
  let user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    // Update avatar if changed
    if (avatar && user.avatar !== avatar) {
      await prisma.user.update({ where: { id: user.id }, data: { avatar } });
    }
  } else {
    // Create new user with random password hash (they'll use Google to login)
    user = await prisma.user.create({
      data: {
        name,
        email,
        avatar,
        passwordHash: await hashPassword(crypto.randomBytes(16).toString("hex")),
        role: "customer",
      },
    });
  }

  await createSession(user.id);
}
