import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|products/placeholder.svg).*)"],
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // صفحات الأدمن والدخول والصيانة — تمرير دائمًا
  if (pathname.startsWith("/admin") || pathname.startsWith("/login") || pathname === "/maintenance") {
    return NextResponse.next();
  }

  // وضع الصيانة — يُفحص من cookies الموقّعة (Server-side only)
  const maintenance = request.cookies.get("maintenance_mode")?.value;
  if (maintenance === "signed:1") {
    const url = request.nextUrl.clone();
    url.pathname = "/maintenance";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}
