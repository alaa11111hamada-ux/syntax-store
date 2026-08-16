"use client";

import { formatPrice } from "@/lib/format";

export type InvoiceData = {
  storeName: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  createdAt: string;
  subtotalCents: number;
  taxCents: number;
  taxRate: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: string;
  paymentMethodName: string;
  paymentMethodFields: { label: string; value: string }[];
  items: { name: string; priceCents: number; qty: number }[];
  couponCode?: string | null;
  couponDiscountCents?: number;
  productDiscountCents?: number;
};

export default function InvoicePDF({ data }: { data: InvoiceData }) {
  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;

    const itemsHtml = data.items
      .map(
        (item) => `
        <tr>
          <td style="padding:10px 14px;border-bottom:1px solid #eee;font-weight:500;">${item.name}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:left;">${formatPrice(item.priceCents)}</td>
          <td style="padding:10px 14px;border-bottom:1px solid #eee;text-align:left;font-weight:600;">${formatPrice(item.priceCents * item.qty)}</td>
        </tr>`
      )
      .join("");

    const hasCoupon = data.couponCode && (data.couponDiscountCents ?? 0) > 0;
    const hasProductDiscount = (data.productDiscountCents ?? 0) > 0;
    const totalDiscount = (data.couponDiscountCents ?? 0) + (data.productDiscountCents ?? 0);

    const html = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>فاتورة ${data.orderNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <style>
    * { font-family: 'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif; margin: 0; padding: 0; box-sizing: border-box; }
    body { padding: 40px; color: #1a1a2e; direction: rtl; background: #fff; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #7c3aed; }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .header-left img { width: 48px; height: 48px; border-radius: 10px; object-fit: contain; }
    .store-name { font-size: 26px; font-weight: 800; color: #7c3aed; }
    .store-subtitle { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .order-info { text-align: left; }
    .order-info p { margin: 3px 0; font-size: 14px; color: #6b7280; }
    .order-info strong { color: #1a1a2e; }
    .section-title { font-size: 15px; font-weight: 700; margin: 20px 0 10px; color: #7c3aed; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th { background: #f8f7ff; padding: 10px 14px; text-align: right; font-size: 13px; font-weight: 600; color: #6b7280; border-bottom: 2px solid #e2e5ee; }
    .totals { margin-top: 20px; }
    .totals .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals .row.discount { color: #16a34a; }
    .totals .row.total { border-top: 2px solid #7c3aed; padding-top: 10px; margin-top: 6px; font-size: 18px; font-weight: 800; color: #7c3aed; }
    .coupon-box { margin-top: 15px; padding: 12px 16px; border: 1px dashed #7c3aed; border-radius: 10px; background: #f8f7ff; }
    .coupon-box .coupon-title { font-size: 13px; font-weight: 700; color: #7c3aed; margin-bottom: 6px; }
    .coupon-box .coupon-detail { font-size: 13px; color: #4b5563; }
    .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #9a9aab; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-left">
      <img src="/logo.png" alt="Logo" />
      <div>
        <div class="store-name">${data.storeName}</div>
        <div class="store-subtitle">فاتورة مبيعات</div>
      </div>
    </div>
    <div class="order-info">
      <p><strong>رقم الطلب:</strong> ${data.orderNumber}</p>
      <p><strong>التاريخ:</strong> ${data.createdAt}</p>
      <p><strong>طريقة الدفع:</strong> ${data.paymentMethodName || (data.paymentMethod === "transfer" ? "تحويل بنكي" : "كاش")}</p>
      ${data.paymentMethodFields.length > 0 ? data.paymentMethodFields.map(f => `<p style="margin:2px 0;font-size:13px;color:#6b7280;">${f.label}: <strong style="color:#1a1a2e;">${f.value}</strong></p>`).join("") : ""}
    </div>
  </div>

  <div class="section-title">بيانات العميل</div>
  <table style="margin-bottom:20px;">
    <tr><td style="padding:4px 0;font-size:14px;"><strong>الاسم:</strong> ${data.customerName}</td></tr>
    <tr><td style="padding:4px 0;font-size:14px;"><strong>الموبايل:</strong> ${data.customerPhone}</td></tr>
    ${data.customerEmail ? `<tr><td style="padding:4px 0;font-size:14px;"><strong>الإيميل:</strong> ${data.customerEmail}</td></tr>` : ""}
  </table>

  <div class="section-title">تفاصيل المنتجات</div>
  <table>
    <thead>
      <tr>
        <th style="text-align:right;">المنتج</th>
        <th style="text-align:center;">الكمية</th>
        <th style="text-align:left;">السعر</th>
        <th style="text-align:left;">الإجمالي</th>
      </tr>
    </thead>
    <tbody>
      ${itemsHtml}
    </tbody>
  </table>

  <div class="totals">
    <div class="row"><span>المجموع الفرعي</span><span>${formatPrice(data.subtotalCents)}</span></div>
    ${hasCoupon ? `<div class="row discount"><span>خصم كوبون (${data.couponCode})</span><span>-${formatPrice(data.couponDiscountCents!)}</span></div>` : ""}
    ${hasProductDiscount ? `<div class="row discount"><span>خصم المنتجات</span><span>-${formatPrice(data.productDiscountCents!)}</span></div>` : ""}
    ${!hasCoupon && !hasProductDiscount && data.discountCents > 0 ? `<div class="row discount"><span>الخصم</span><span>-${formatPrice(data.discountCents)}</span></div>` : ""}
    ${data.taxCents > 0 ? `<div class="row"><span>الضريبة (${data.taxRate}%)</span><span>${formatPrice(data.taxCents)}</span></div>` : ""}
    <div class="row total"><span>الإجمالي</span><span>${formatPrice(data.totalCents)}</span></div>
  </div>

  ${hasCoupon ? `
  <div class="coupon-box">
    <div class="coupon-title">تفاصيل الكوبون</div>
    <div class="coupon-detail">كود الخصم: <strong>${data.couponCode}</strong></div>
    <div class="coupon-detail">قيمة الخصم: <strong>${formatPrice(data.couponDiscountCents!)}</strong></div>
    ${data.productDiscountCents && data.productDiscountCents > 0 ? `<div class="coupon-detail">خصم إضافي على المنتجات: <strong>${formatPrice(data.productDiscountCents)}</strong></div>` : ""}
  </div>
  ` : ""}

  <div class="footer">
    <p>شكراً لتسوقك من ${data.storeName}</p>
  </div>

  <script>window.onload=function(){window.print();}<\/script>
</body>
</html>`;

    win.document.write(html);
    win.document.close();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-surface-2"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
      </svg>
      طباعة الفاتورة
    </button>
  );
}
