import Link from "next/link";
import { site } from "@/lib/site";
import { getSettings } from "@/lib/settings";

export default async function Hero() {
  const settings = await getSettings();
  const description = settings.store_description || site.description;
  return (
    <section className="relative overflow-hidden bg-bg">
      {/* توهّج خلفي بنفسجي */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-600/25 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.15] [background-image:radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] [background-size:32px_32px]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-1.5 text-sm font-medium text-brand-300">
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          صفر عمولة · تحكّم كامل
        </span>

        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight text-fg sm:text-6xl">
          منتجاتك في <span className="text-gradient">مكان واحد</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-muted sm:text-lg">
          {description}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/#products"
            className="w-full rounded-xl bg-brand-gradient px-8 py-3.5 text-center font-bold text-white shadow-lg shadow-brand-600/30 transition-opacity hover:opacity-95 sm:w-auto"
          >
            اتفرّج على المنتجات
          </Link>
          <Link
            href="/#why"
            className="w-full rounded-xl border border-line bg-surface px-8 py-3.5 text-center font-semibold text-fg transition-colors hover:bg-surface-2 sm:w-auto"
          >
            ليه تشتري مننا؟
          </Link>
        </div>

        {/* نقاط ثقة */}
        <div className="mx-auto mt-12 grid max-w-2xl grid-cols-1 gap-4 text-sm text-muted sm:grid-cols-3">
          <TrustPoint text="دفع كاش أو تحويل" />
          <TrustPoint text="منتجات رقمية وملموسة" />
          <TrustPoint text="تتبّع حالة طلبك" />
        </div>
      </div>
    </section>
  );
}

function TrustPoint({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface/60 px-4 py-3">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-brand-400"
        aria-hidden="true"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
      <span>{text}</span>
    </div>
  );
}
