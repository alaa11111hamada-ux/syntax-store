import { NextRequest, NextResponse } from "next/server";
import { handleGoogleCallback } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", req.url));
  }

  try {
    await handleGoogleCallback(code);
    return NextResponse.redirect(new URL("/", req.url));
  } catch (e) {
    console.error("Google auth error:", e);
    return NextResponse.redirect(new URL("/login?error=google_auth_failed", req.url));
  }
}
