import Link from "next/link";
import { site } from "@/lib/site";
import { getSettings } from "@/lib/settings";
import ShareButtons from "@/components/ShareButtons";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ order?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const sp = await searchParams;
  const orderNumber = sp.order ?? "";
  const settings = await getSettings();
  const whatsapp = settings.store_whatsapp || site.whatsapp;

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      {/* أيقونة التأكيد */}
      <div className="relative">
        <div className="grid h-24 w-24 place-items-center rounded-full bg-brand-gradient shadow-2xl shadow-brand-600/30">
          <svg className="h-12 w-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
      </div>

      <h1 className="mt-8 text-3xl font-extrabold text-fg">
        شكراً لطلبك!
      </h1>
      <p className="mt-3 max-w-sm text-muted">
        تم استلام طلبك بنجاح وهنبدأ في معالجته حالاً. هتتلقى إشعار بمجرد تحديث حالة الطلب.
      </p>

      {/* رقم الطلب */}
      {orderNumber && (
        <div className="mt-6 rounded-2xl border border-line bg-surface px-6 py-4">
          <p className="text-xs text-muted">رقم الطلب</p>
          <p className="tnum mt-1 text-lg font-extrabold text-brand-400">{orderNumber}</p>
        </div>
      )}

      {/* الخطوات التالية */}
      <div className="mt-8 w-full space-y-3">
        <Link
          href="/track"
          className="flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3 font-bold text-white shadow-lg shadow-brand-600/25 transition-opacity hover:opacity-95"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          تتبّع الطلب
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-6 py-3 font-semibold text-fg transition-colors hover:bg-surface-2"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
          </svg>
          متابعة التسوق
        </Link>
      </div>

      {/* مشاركة */}
      <div className="mt-6">
        <ShareButtons name="طلبي" slug="" />
      </div>

      {/* واتساب */}
      <a
        href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`مرحباً، عندي استفسار بخصوص طلب رقم ${orderNumber}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-6 py-3 text-sm font-semibold text-green-400 transition-colors hover:bg-green-500/20"
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        مساعدة عبر واتساب
      </a>
    </div>
  );
}
