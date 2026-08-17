import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "شروط الاستخدام",
  description: "شروط الاستخدام لمتجر سينتاكس Store",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-extrabold text-fg">شروط الاستخدام</h1>
      <p className="mb-4 text-sm text-muted">آخر تحديث: أغسطس 2026</p>

      <div className="space-y-8 text-fg leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-bold">١. القبول</h2>
          <p>
            باستخدامك لمتجر &quot;سينتاكس Store&quot;، أنت توافق على هذه الشروط والأحكام. إذا لا توافق، يُرجى عدم استخدام الموقع.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٢. المنتجات الرقمية</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>جميع المنتجات رقمية (ملفات PDF، كورسات، قوالب) ولا تُشحن فيزيائيًا.</li>
            <li>بعد إتمام الشراء، ستحصل على رابط تحميل المنتج.</li>
            <li>يحق لك تحميل المنتج عدد محدودًا من المرات (حسب تحديد المنتج).</li>
            <li>المنتجات الرقمية لا يمكن استرجاعها أو استبدالها بعد التحميل.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٣. الأسعار والدفع</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>جميع الأسعار بالجنيه المصري شاملة الضريبة (إن وُجدت).</li>
            <li>نقبل الدفع عبر المحافظ الإلكترونية والتحويل البنكي.</li>
            <li>يجب رفع صورة إثبات الدفع لتأكيد الطلب.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٤. حقوق الملكية الفكرية</h2>
          <p>
            جميع المنتجات الرقمية محمية بحقوق الملكية الفكرية. عند الشراء، تحصل على تصريح شخصي للاستخدام فقط. يُمنع إعادة البيع أو التوزيع أو التعديل.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٥. الحسابات</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>أنت مسؤول عن حفظ معلومات تسجيل الدخول الخاصة بك.</li>
            <li>يُمنع استخدام الموقع لأغراض غير قانونية أو احتيالية.</li>
            <li>نحتفظ بالحق في تعليق أو حذف الحسابات المخالفة.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٦. الدعم الفني</h2>
          <p>
            نوفر نظام تذاكر دعم فني للإجابة على استفساراتك وحل مشاكلك. يُرجى التواصل عبر صفحة الدعم في حسابك.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٧. التعديلات</h2>
          <p>
            نحتفظ بالحق في تعديل هذه الشروط في أي وقت. يُنصح بمراجعة هذه الصفحة بانتظام.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٨. التواصل</h2>
          <p>
            لأي استفسارات بخصوص شروط الاستخدام، تواصل معنا عبر البريد الإلكتروني:{" "}
            <a href="mailto:hello@example.com" className="text-brand-400 hover:underline">hello@example.com</a>
          </p>
        </section>
      </div>

      <div className="mt-10 text-center">
        <Link href="/" className="text-brand-400 hover:underline">
          رجوع للمتجر
        </Link>
      </div>
    </div>
  );
}
