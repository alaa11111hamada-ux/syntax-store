import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description: "سياسة الخصوصية لمتجر سينتاكس Store",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-extrabold text-fg">سياسة الخصوصية</h1>
      <p className="mb-4 text-sm text-muted">آخر تحديث: أغسطس 2026</p>

      <div className="space-y-8 text-fg leading-relaxed">
        <section>
          <h2 className="mb-3 text-xl font-bold">١. مقدمة</h2>
          <p>
            مرحبًا بك في متجر &quot;سينتاكس Store&quot; (&quot;نحن&quot;). نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية. تصف هذه السياسة كيف نجمع بياناتك واستخدمها ونحميها.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٢. البيانات اللي بنجمعها</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li><strong>بيانات الحساب:</strong> الاسم، البريد الإلكتروني، رقم الهاتف (اختياري).</li>
            <li><strong>بيانات الطلبات:</strong> عنوان التسليم، طريقة الدفع، صورة إثبات الدفع.</li>
            <li><strong>بيانات الاستخدام:</strong> صفحات زرتها، وقت الزيارة، نوع المتصفح (لتحسين الخدمة).</li>
            <li><strong>ملفات تعريف الارتباط:</strong> نستخدم ملفات تعريف الارتباط لتسجيل جلستك وتفضيلاتك.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٣. كيف بنستخدم بياناتك</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li>معالجة الطلبات وتوصيل المنتجات الرقمية.</li>
            <li>إرسال تحديثات حالة الطلب.</li>
            <li>تحسين تجربة التسوق والدعم الفني.</li>
            <li>منع الاحتيال وحماية حسابك.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٤. مشاركة البيانات</h2>
          <p>
            لا نبيع بياناتك لأي طرف ثالث. قد نشارك بياناتك فقط مع:
          </p>
          <ul className="list-disc space-y-2 pr-6">
            <li>مزودي خدمات الدفع (لمعالجة المعاملات).</li>
            <li>مزودي التتبع (Meta Pixel، Google Analytics) لتحسين الإعلانات.</li>
            <li>جهات إنفاذ القانون لو اتطلب منا قانونيًا.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٥. حقوقك</h2>
          <ul className="list-disc space-y-2 pr-6">
            <li><strong>الوصول:</strong> تعرف على أي بيانات بنجمعها عنك.</li>
            <li><strong>الحذف:</strong> تطلب حذف بياناتك الشخصية.</li>
            <li><strong>التعديل:</strong> تعديل بياناتك الشخصية في أي وقت من صفحة الحساب.</li>
            <li><strong>إلغاء الاشتراك:</strong> إلغاء استلام الرسائل التسويقية.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٦. الأمان</h2>
          <p>
            نستخدم إجراءات أمنية مناسبة لحماية بياناتك من الوصول غير المصرح به. لكن لا يوجد طريقة نقل عبر الإنترنت آئة بنسبة 100%.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٧. التغييرات</h2>
          <p>
            قد نحدّث هذه السياسة من وقت لآخر. سنقوم بإبلاغك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار على الموقع.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">٨. التواصل</h2>
          <p>
            لأي استفسارات بخصوص سياسة الخصوصية، تواصل معنا عبر البريد الإلكتروني:{" "}
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
