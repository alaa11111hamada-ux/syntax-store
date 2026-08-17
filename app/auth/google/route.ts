import { NextRequest, NextResponse } from "next/server";
import { getGoogleAuthUrl, handleGoogleCallback } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const errorDescription = req.nextUrl.searchParams.get("error_description");

  // لا code ولا error — ده الطلب الأولي، حوّله على Google
  if (!code && !error) {
    const url = await getGoogleAuthUrl();
    return NextResponse.redirect(url);
  }

  if (error) {
    console.error("Google OAuth error:", error, errorDescription);
    return NextResponse.redirect(new URL(`/login?error=google_auth_failed&detail=${encodeURIComponent(errorDescription || error)}`, req.url));
  }

  if (!code) {
    console.error("Google OAuth: no code returned");
    return NextResponse.redirect(new URL("/login?error=google_auth_failed&detail=no_code", req.url));
  }

  try {
    await handleGoogleCallback(code);
    return NextResponse.redirect(new URL("/", req.url));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    console.error("Google auth error:", message);
    return NextResponse.redirect(new URL(`/login?error=google_auth_failed&detail=${encodeURIComponent(message)}`, req.url));
  }
}
