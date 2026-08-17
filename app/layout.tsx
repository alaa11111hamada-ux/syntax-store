import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { site } from "@/lib/site";
import { CartProvider } from "@/lib/cart";
import { WishlistProvider } from "@/lib/wishlist";
import { CompareProvider } from "@/lib/compare";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import TrackingPixels from "@/components/TrackingPixels";
import { getSettings } from "@/lib/settings";
import MaintenanceGuard from "@/components/MaintenanceGuard";
import ErrorBoundary from "@/components/ErrorBoundary";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  let settings;
  try {
    settings = await getSettings();
  } catch {
    settings = {} as Record<string, string>;
  }
  const name = settings.store_name || site.name;
  const desc = settings.store_description || site.description;
  return {
    title: {
      default: `${name} — ${site.tagline}`,
      template: `%s — ${name}`,
    },
    description: desc,
    manifest: "/manifest.json",
    themeColor: "#f97316",
    openGraph: {
      title: `${name} — ${site.tagline}`,
      description: desc,
      type: "website",
    },
  };
}

function buildThemeScript(s: Record<string, string>) {
  const primary = s.theme_primary_color || "";
  const bg = s.theme_bg_color || "";
  const fg = s.theme_fg_color || "";

  return `
  (function(){
    try {
      var t = localStorage.getItem('theme');
      var d = t ? t === 'dark' : true;
      document.documentElement.classList.add(d ? 'dark' : 'light');
    } catch(e) {
      document.documentElement.classList.add('dark');
    }
    var root = document.documentElement;
    ${primary ? `root.style.setProperty('--color-brand-500', '${primary}');
    root.style.setProperty('--color-brand-600', '${primary}');
    root.style.setProperty('--color-brand-700', '${primary}');
    root.style.setProperty('--color-brand-400', '${primary}cc');` : ""}
    ${bg ? `root.style.setProperty('--color-bg', '${bg}');
    root.style.setProperty('--background', '${bg}');` : ""}
    ${fg ? `root.style.setProperty('--color-fg', '${fg}');
    root.style.setProperty('--foreground', '${fg}');` : ""}
  })();`;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSettings().catch(() => ({} as Record<string, string>));
  const themeScript = buildThemeScript(settings);
  const description = settings.store_description || site.description;

  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full dark`} suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-bg text-fg antialiased" suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[100] focus:rounded-xl focus:bg-brand-gradient focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white">
          تخطي للمحتوى
        </a>
        <ErrorBoundary>
        <TrackingPixels />
        <MaintenanceGuard isMaintenance={settings.maintenance_mode === "1"}>
          <CartProvider>
            <WishlistProvider>
              <CompareProvider>
                <SiteHeader />
                <main id="main-content" className="flex-1 pb-16 lg:pb-0">{children}</main>
                <SiteFooter />
              </CompareProvider>
            </WishlistProvider>
          </CartProvider>
        </MaintenanceGuard>
        </ErrorBoundary>
      </body>
    </html>
  );
}
